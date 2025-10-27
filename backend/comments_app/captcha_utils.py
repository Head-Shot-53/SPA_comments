import io
import random
import string
import base64
from PIL import Image, ImageDraw, ImageFilter  
from django.core.cache import cache

CAPTCHA_TTL = 300         
CAPTCHA_KEY_PREFIX = "captcha:"


def _rand_text(length: int = 5) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(random.choice(alphabet) for _ in range(length))


def generate_captcha():
    text = _rand_text(5)

    # 1) полотно
    width, height = 160, 60
    img = Image.new("RGB", (width, height), (245, 245, 245))

    # 2) інструмент малювання 
    draw = ImageDraw.Draw(img)

    # 3) шум/лінії
    for _ in range(10):
        x1, y1 = random.randint(0, width), random.randint(0, height)
        x2, y2 = random.randint(0, width), random.randint(0, height)
        draw.line((x1, y1, x2, y2), fill=(200, 200, 200), width=1)

    # 4) текст
    start_x = 15
    for ch in text:
        y = random.randint(5, 20)
        draw.text((start_x, y), ch, fill=(50, 50, 50))
        start_x += 25

    # 5) легке згладжування
    img = img.filter(ImageFilter.SMOOTH)

    # 6) у base64 data URL
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    token = _rand_text(24)
    cache.set(f"{CAPTCHA_KEY_PREFIX}{token}", text.lower(), CAPTCHA_TTL)

    return token, f"data:image/png;base64,{b64}"


def check_captcha(token: str, solution: str) -> bool:
    if not token or not solution:
        return False
    key = f"{CAPTCHA_KEY_PREFIX}{token}"
    expected = cache.get(key)
    if expected is None:
        return False
    cache.delete(key)
    return expected == solution.lower().strip()
