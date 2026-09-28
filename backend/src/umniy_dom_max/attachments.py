"""Вложения: только фото. Формат по содержимому (libmagic), сжатие и лимит 10 МБ.

Файлы приходят data URL (base64). Сначала всегда сжимаем, потом проверяем размер:
до 1200 px по длинной стороне, JPEG q45 — текст 10pt на фото листа A4 читается.
"""

import base64
import binascii
import io
import tempfile

import magic
from fastapi import HTTPException
from loguru import logger
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

# HEIC/HEIF с айфонов
register_heif_opener()

MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

IMAGE_MAX_SIDE = 1200
IMAGE_QUALITY = 45

ALLOWED_MIME = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/bmp",
    "image/tiff",
}


def _decode(data_url: str) -> bytes:
    b64 = data_url.split(",", 1)[1] if data_url.startswith("data:") else data_url
    try:
        return base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError) as e:
        raise HTTPException(400, "Вложение повреждено") from e


def _detect_mime(data: bytes) -> str:
    # libmagic 5.46 по буферу узнаёт не все форматы — проверяем через файл
    detector = magic.Magic(mime=True)
    detector.setparam(magic.MAGIC_PARAM_BYTES_MAX, len(data) + 1)
    with tempfile.NamedTemporaryFile() as tmp:
        tmp.write(data)
        tmp.flush()
        return detector.from_file(tmp.name)


def _compress_image(data: bytes, max_side: int = IMAGE_MAX_SIDE, quality: int = IMAGE_QUALITY) -> bytes:
    with Image.open(io.BytesIO(data)) as img:
        img = ImageOps.exif_transpose(img)
        img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            bg = Image.new("RGB", img.size, "white")
            bg.paste(img, mask=img.getchannel("A"))
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
        return out.getvalue()


def prepare_attachment(data_url: str) -> str:
    """Проверяет, что это фото, сжимает в JPEG и возвращает новый data URL."""
    data = _decode(data_url)
    mime = _detect_mime(data)
    if mime not in ALLOWED_MIME:
        raise HTTPException(415, f"Можно прикреплять только фото, получен {mime}")

    try:
        result = _compress_image(data)
        # огромное фото после стандартного сжатия всё ещё больше лимита — жмём сильнее
        if len(result) > MAX_ATTACHMENT_BYTES:
            result = _compress_image(data, max_side=1000, quality=35)
    except Exception as e:
        logger.warning(f"Не удалось обработать фото {mime}: {e}")
        raise HTTPException(415, "Фото повреждено") from e

    if len(result) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(413, "Фото больше 10 МБ даже после сжатия")

    return f"data:image/jpeg;base64,{base64.b64encode(result).decode()}"


def prepare_attachments(data_urls: list[str]) -> list[str]:
    return [prepare_attachment(url) for url in data_urls]


def mail_attachments(data_urls: list[str]) -> list[dict]:
    """Вложения для письма из уже подготовленных data URL (всегда JPEG)."""
    return [
        {"data": url.split(",", 1)[1], "filename": f"photo_{i}.jpg", "mime": "image/jpeg"}
        for i, url in enumerate(data_urls, 1)
    ]
