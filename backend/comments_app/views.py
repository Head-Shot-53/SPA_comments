from rest_framework import generics, status
from .models import Comment
from .serializers import CommentSerializer, AttachmentSerializer

from rest_framework.response import Response
from rest_framework.views import APIView
from .captcha_utils import generate_captcha
from django.shortcuts import get_object_or_404

from rest_framework.parsers import MultiPartParser, FormParser
from django.http import QueryDict

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        instance = serializer.save()
        channel_layer = get_channel_layer()
        payload = {
            "kind": "root_created",
            "comment": CommentSerializer(instance).data,
        }
        async_to_sync(channel_layer.group_send)(
            "comments",
            {"type": "ws_comment_created", "payload": payload}
        )

    def get_queryset(self):
        qs = (
            Comment.objects
            .filter(parent__isnull=True)
            .select_related('author')
            .prefetch_related('attachments')
        )

        sort = self.request.query_params.get('sort', 'date')
        order = self.request.query_params.get('order', 'desc')

        sort_map = {
            'date': 'created_at',
            'username': 'author__username',
            'email': 'author__email',
        }
        field = sort_map.get(sort, 'created_at')

        if order == 'desc':
            field = f'-{field}'

        return qs.order_by(field, '-id')

   
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class CaptchaView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        token, image_b64 = generate_captcha()
        return Response({'token': token, 'image': image_b64})


class ReplyListCreateView(generics.ListCreateAPIView):
    """
    GET /api/comments/<id>/replies/
    POST /api/comments/<id>/replies/
    """
    serializer_class = CommentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        instance = serializer.save()
        channel_layer = get_channel_layer()
        payload = {
            "kind": "reply_created",
            "comment": CommentSerializer(instance).data,
            "parent_id": instance.parent_id,
        }
        async_to_sync(channel_layer.group_send)(
            "comments",
            {"type": "ws_comment_created", "payload": payload}
        )

    def get_queryset(self):
        parent_id = self.kwargs["pk"]
        return (
            Comment.objects
            .select_related("author", "parent")
            .filter(parent_id=parent_id)
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        parent = get_object_or_404(Comment, pk=self.kwargs["pk"])

        payload = request.data
        if isinstance(payload, QueryDict):
            payload = payload.dict()
        else:
            payload = dict(payload)

        payload["parent"] = parent.pk

        serializer = self.get_serializer(data=payload) 
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class AttachmentUploadView(generics.CreateAPIView):
    """
    POST /api/attachments/
    form-data: comment=<id>, file=<binary>
    """
    serializer_class = AttachmentSerializer
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
