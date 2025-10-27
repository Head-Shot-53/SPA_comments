from django.urls import path
from .views import (
    CommentListCreateView,
    ReplyListCreateView,
    CaptchaView,
    AttachmentUploadView,
)

urlpatterns = [
    path("comments/", CommentListCreateView.as_view(), name="comments_list_create"),
    path("comments/<int:pk>/replies/", ReplyListCreateView.as_view(), name="comment_replies"),
    path("captcha/", CaptchaView.as_view(), name="captcha"),
    path("attachments/", AttachmentUploadView.as_view(), name="attachment_upload"),
]
