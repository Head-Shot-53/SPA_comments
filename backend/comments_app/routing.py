from django.urls import re_path
from .ws import CommentConsumer  

websocket_urlpatterns = [
    re_path(r"^ws/comments/$", CommentConsumer.as_asgi()),
]
