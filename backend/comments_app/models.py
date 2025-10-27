from django.db import models
import mimetypes
from django.core.validators import FileExtensionValidator

class Commenter(models.Model):
    username = models.CharField(max_length=32, db_index=True)
    email = models.EmailField(db_index=True)
    homepage = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
        ]

    def __str__(self):
        return f"{self.username} <{self.email}>"


class Comment(models.Model):
    author = models.ForeignKey(Commenter, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["parent", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.author.username}: {self.text[:40]}"

class Attachment(models.Model):
    IMAGE = 'image'
    TEXT = 'text'
    TYPES = [(IMAGE, 'Image'), (TEXT, 'Text')]

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    file_type = models.CharField(max_length=8, choices=TYPES)
    mime = models.CharField(max_length=100)
    size_bytes = models.PositiveIntegerField()
    preview_image = models.ImageField(upload_to="previews/%Y/%m/%d/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['comment', '-created_at'])]

    def __str__(self):
        return f'{self.file.name} ({self.file_type})'