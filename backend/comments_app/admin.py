from django.contrib import admin
from .models import Commenter, Comment, Attachment


@admin.register(Commenter)
class CommenterAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "homepage", "created_at")
    search_fields = ("username", "email")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "parent", "created_at")
    list_filter = ("created_at",)
    search_fields = ("author__username", "author__email", "text")

@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "comment", "file_type", "mime", "size_bytes", "created_at")
    list_filter = ("file_type", "created_at")
    search_fields = ("comment__author__username", "comment__author__email", "file")