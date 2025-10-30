from rest_framework import serializers
from .models import Comment, Commenter, Attachment
import re
import bleach
from .captcha_utils import check_captcha

from PIL import Image
from django.core.files.base import ContentFile
import io

from .validators import sanitize_and_xhtml


ALLOWED_TAGS = ["a", "code", "i", "strong"]
ALLOWED_ATTRS = {"a": ["href", "title", "target", "rel"]}

USERNAME_RE = re.compile(r"^[A-Za-z0-9]{1,32}$")

ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif"}
MAX_TXT_BYTES = 100 * 1024

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id", "comment", "file", "file_type", "mime", "size_bytes", "preview_image", "created_at"]
        read_only_fields = ["id", "file_type", "mime", "size_bytes", "preview_image", "created_at"]

    def validate(self, attrs):
        f = self.context['request'].FILES.get('file')
        if not f:
            raise serializers.ValidationError({"file":"Файл обов'язковий"})
        name = f.name.lower()
        mime = f.content_type or ""
        size = f.size or 0

        if name.endswith(".txt") or mime == "text/plain":
            if size > MAX_TXT_BYTES:
                raise serializers.ValidationError({'file':"TXT не більше 100kb"})
            attrs['file_type'] = Attachment.TEXT
        else:
            if not any(name.endswith(ext) for ext in ALLOWED_IMAGE_EXT):
                raise serializers.ValidationError({'file':"Дозволено JPG/PNG/GIF або TXT"})
            if not mime.startswith("image/"):
                raise serializers.ValidationError({"file":"Невірний MIME для зображення"})
            attrs['file_type'] = Attachment.IMAGE

        attrs['mime'] = mime
        attrs['size_bytes'] = size
        return attrs
    
    def create(self, validated_data):
        instance = super().create(validated_data)
        if instance.file_type == Attachment.IMAGE:
            instance.preview_image = self._make_preview(instance.file)
            instance.save(update_fields = ['preview_image'])
        return instance
    
    @staticmethod
    def _make_preview(django_file):
        django_file.seek(0)
        img = Image.open(django_file)
        img = img.convert("RGB")
        img.thumbnail((320, 240))  
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        buf.seek(0)
        return ContentFile(buf.read(), name=f"preview_{django_file.name.rsplit('/',1)[-1]}.jpg")

class CommenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commenter
        fields = ["id", "username", "email", "homepage"]

    def validate_username(self, value: str) -> str:
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError("Username має містити лише латинські букви та цифри (1–32).")
        return value


class CommentSerializer(serializers.ModelSerializer):
    author = CommenterSerializer()
    captcha_token = serializers.CharField(write_only=True, required=True)
    captcha_solution = serializers.CharField(write_only=True, required=True)
    
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "text", "parent", "created_at", "captcha_token", "captcha_solution", "attachments"]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        # CAPTCHA
        token = attrs.pop("captcha_token", None)
        solution = attrs.pop("captcha_solution", None)
        if not check_captcha(token, solution):
            raise serializers.ValidationError({"captcha": "Невірна CAPTCHA або час дії минув."})

        # Санітизація  XHTML
        raw = attrs.get("text") or ""
        cleaned = bleach.clean(
            raw,
            tags=ALLOWED_TAGS,
            attributes=ALLOWED_ATTRS,
            strip=True,
        )
        cleaned = cleaned.replace("<a ", '<a target="_blank" rel="nofollow noopener" ')
        xhtml = sanitize_and_xhtml(cleaned)

        if not xhtml.strip():
            raise serializers.ValidationError({"text": "Порожній або некоректний HTML після обробки."})

        attrs["text"] = xhtml

        return super().validate(attrs)

    def create(self, validated_data):
        author_data = validated_data.pop("author")
        author, _ = Commenter.objects.get_or_create(
            username=author_data["username"],
            email=author_data["email"],
            defaults={"homepage": author_data.get("homepage")},
        )
        if author_data.get("homepage") and not author.homepage:
            author.homepage = author_data["homepage"]
            author.save(update_fields=["homepage"])

        # на випадок, якщо десь вище таки просочились зайві ключі
        validated_data.pop("text_html", None)
        validated_data.pop("text_raw", None)

        return Comment.objects.create(author=author, **validated_data)


