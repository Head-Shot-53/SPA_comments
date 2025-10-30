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
        f = self.context["request"].FILES.get("file")
        if not f:
            raise serializers.ValidationError({"file": "Файл обов'язковий"})
        name = f.name.lower()
        mime = f.content_type or ""
        size = f.size or 0

        if name.endswith(".txt") or mime == "text/plain":
            if size > MAX_TXT_BYTES:
                raise serializers.ValidationError({"file": "TXT не більше 100kb"})
            attrs["file_type"] = Attachment.TEXT
        else:
            if not any(name.endswith(ext) for ext in ALLOWED_IMAGE_EXT):
                raise serializers.ValidationError({"file": "Дозволено JPG/PNG/GIF або TXT"})
            if not mime.startswith("image/"):
                raise serializers.ValidationError({"file": "Невірний MIME для зображення"})
            attrs["file_type"] = Attachment.IMAGE

        attrs["mime"] = mime
        attrs["size_bytes"] = size
        return attrs

    def create(self, validated_data):
        instance = super().create(validated_data)
        if instance.file_type == Attachment.IMAGE:
            instance.preview_image = self._make_preview(instance.file)
            instance.save(update_fields=["preview_image"])
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
        return ContentFile(buf.read(), name=f"preview_{django_file.name.rsplit('/', 1)[-1]}.jpg")


class CommenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commenter
        fields = ["id", "username", "email", "homepage"]

    def validate_username(self, value: str) -> str:
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError("Username має містити лише латинські букви та цифри (1–32).")
        return value


class CommentSerializer(serializers.ModelSerializer):
    author = CommenterSerializer(required=False, allow_null=True)
    captcha_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    captcha_solution = serializers.CharField(write_only=True, required=False, allow_blank=True)

    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "author",
            "text",
            "parent",
            "created_at",
            "captcha_token",
            "captcha_solution",
            "attachments",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        is_auth = bool(request and request.user and request.user.is_authenticated)

        # санітизація + XHTML 
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

        if is_auth:
            # алогінений — ігноруємо анонімні поля
            attrs.pop("author", None)
            attrs.pop("captcha_token", None)
            attrs.pop("captcha_solution", None)
        else:
            # анонім автор і капча обов'язкові
            if not attrs.get("author"):
                raise serializers.ValidationError({"author": ["This field is required."]})

            token = attrs.pop("captcha_token", None)
            solution = attrs.pop("captcha_solution", None)
            if not token:
                raise serializers.ValidationError({"captcha_token": ["This field is required."]})
            if not solution:
                raise serializers.ValidationError({"captcha_solution": ["This field is required."]})
            if not check_captcha(token, solution):
                raise serializers.ValidationError({"captcha": "Невірна CAPTCHA або час дії минув."})

        return super().validate(attrs)

    def create(self, validated_data):
        request = self.context.get("request")
        is_auth = bool(request and request.user and request.user.is_authenticated)

        # прибираємо можливі службові ключі, якщо ще десь просочились
        validated_data.pop("text_html", None)
        validated_data.pop("text_raw", None)

        if is_auth:
            if hasattr(Comment, "user"):
                return Comment.objects.create(user=request.user, **validated_data)

            # інакше  мапимо request.user  Commenter
            username = getattr(request.user, "username", None) or "user"
            email = getattr(request.user, "email", None) or ""
            commenter, _ = Commenter.objects.get_or_create(
                username=username,
                email=email,
                defaults={"homepage": ""},
            )
            return Comment.objects.create(author=commenter, **validated_data)

        # Анонімний шлях — беремо автора з payload
        author_data = validated_data.pop("author")
        commenter, _ = Commenter.objects.get_or_create(
            username=author_data["username"],
            email=author_data["email"],
            defaults={"homepage": author_data.get("homepage")},
        )
        # якщо передали homepage і в базі порожньо — оновимо
        if author_data.get("homepage") and not commenter.homepage:
            commenter.homepage = author_data["homepage"]
            commenter.save(update_fields=["homepage"])

        return Comment.objects.create(author=commenter, **validated_data)
