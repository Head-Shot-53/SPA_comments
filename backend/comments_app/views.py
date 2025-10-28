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



class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer 

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
        qs = Comment.objects.select_related('author').filter(parent__isnull=True)
        sort = self.request.query_params.get('sort', 'date')
        order = self.request.query_params.get('order', 'desc')

        if sort == 'username':
            field = 'author__username'
        if sort == 'email':
            field = 'author__email'
        else:
            field = 'created_at'

        if order == 'desc':
            field = '-' + field
        return qs.order_by(field)

class CaptchaView(APIView):
    """
    GET /api/captcha/ -> {token, image_base64}
    """
    def get(self, request, *args, **kwargs):
        token, image_b64 = generate_captcha()
        return Response({'token':token, 'image':image_b64})
       
    
class ReplyListCreateView(generics.ListCreateAPIView):
    """
    GET /api/comments/<id>/replies/ -> список відповідей (пагінація DRF)
    POST /api/comments/<id>/replies/ -> створити відповідь (потрібні author, text, captcha_token/solution)
    """
    serializer_class = CommentSerializer

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

        # Безпечна копія payload у звичайний dict
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
