"""Вложения: формат по содержимому (libmagic), сжатие и лимит 10 МБ.

Файлы приходят data URL (base64). Сначала всегда сжимаем, потом проверяем размер:
- картинки — до 1600 px по длинной стороне, JPEG q60 (текст на фото читается);
- PDF — ghostscript с пресетом /ebook (150 dpi);
- docx/xlsx/pptx — пережимаем картинки внутри и сам zip.
Остальное (txt, csv, архивы, аудио) без потери читаемости не сжать — отдаём как есть.
"""

import base64
import binascii
import io
import mimetypes
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

import magic
from fastapi import HTTPException
from loguru import logger
from PIL import Image, ImageOps

MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

IMAGE_MAX_SIDE = 1600
IMAGE_QUALITY = 60

# картинки, которые пережимаем в JPEG (gif не трогаем — анимация)
COMPRESSIBLE_IMAGES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}

OOXML = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}

ALLOWED_MIME = {
    *COMPRESSIBLE_IMAGES,
    "image/gif",
    "image/heic",
    "image/heif",
    "application/pdf",
    *OOXML,
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    # старые doc/xls/ppt libmagic часто видит просто как OLE-контейнер
    "application/CDFV2",
    "application/x-ole-storage",
    "text/plain",
    "text/csv",
    "text/rtf",
    "application/rtf",
    "application/zip",
    "application/x-rar",
    "application/vnd.rar",
    "application/x-7z-compressed",
}

EXTENSIONS = {
    "image/jpeg": ".jpg",
    "application/msword": ".doc",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/CDFV2": ".doc",
    "application/x-ole-storage": ".doc",
    "text/plain": ".txt",
    "application/vnd.rar": ".rar",
    "application/x-rar": ".rar",
}


def _detect_mime(data: bytes) -> str:
    # libmagic 5.46 по буферу не узнаёт zip/docx (сигнатура в конце файла) — проверяем через файл
    detector = magic.Magic(mime=True)
    detector.setparam(magic.MAGIC_PARAM_BYTES_MAX, len(data) + 1)
    with tempfile.NamedTemporaryFile() as tmp:
        tmp.write(data)
        tmp.flush()
        return detector.from_file(tmp.name)


def _is_allowed(mime: str) -> bool:
    return mime in ALLOWED_MIME or mime.startswith("audio/")


def _decode(data_url: str) -> bytes:
    b64 = data_url.split(",", 1)[1] if data_url.startswith("data:") else data_url
    try:
        return base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError) as e:
        raise HTTPException(400, "Вложение повреждено") from e


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


def _compress_ooxml_image(data: bytes, name: str) -> bytes:
    """Картинка внутри docx/xlsx/pptx: формат сохраняем, он зашит в расширение."""
    with Image.open(io.BytesIO(data)) as img:
        img.thumbnail((IMAGE_MAX_SIDE, IMAGE_MAX_SIDE), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        if name.endswith((".jpg", ".jpeg")):
            img.convert("RGB").save(out, "JPEG", quality=IMAGE_QUALITY, optimize=True)
        else:
            img.save(out, "PNG", optimize=True)
        return out.getvalue()


def _compress_ooxml(data: bytes) -> bytes:
    src = zipfile.ZipFile(io.BytesIO(data))
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as dst:
        for item in src.infolist():
            content = src.read(item)
            name = item.filename.lower()
            if "/media/" in name and name.endswith((".jpg", ".jpeg", ".png")):
                try:
                    smaller = _compress_ooxml_image(content, name)
                    if len(smaller) < len(content):
                        content = smaller
                except Exception:
                    pass
            dst.writestr(item.filename, content)
    return out.getvalue()


def _compress_pdf(data: bytes) -> bytes:
    gs = shutil.which("gs")
    if not gs:
        logger.warning("ghostscript не найден, PDF не сжимается")
        return data
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = Path(tmp, "in.pdf"), Path(tmp, "out.pdf")
        src.write_bytes(data)
        subprocess.run(
            [
                gs, "-q", "-dNOPAUSE", "-dBATCH", "-dSAFER",
                "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.5",
                "-dPDFSETTINGS=/ebook", "-dDetectDuplicateImages=true",
                f"-sOutputFile={dst}", str(src),
            ],
            check=True,
            timeout=120,
            capture_output=True,
        )
        return dst.read_bytes()


def _compress(data: bytes, mime: str) -> tuple[bytes, str]:
    try:
        if mime in COMPRESSIBLE_IMAGES:
            result, result_mime = _compress_image(data), "image/jpeg"
            # огромное фото после стандартного сжатия всё ещё больше лимита — жмём сильнее
            if len(result) > MAX_ATTACHMENT_BYTES:
                result = _compress_image(data, max_side=1200, quality=45)
        elif mime == "application/pdf":
            result, result_mime = _compress_pdf(data), mime
        elif mime in OOXML:
            result, result_mime = _compress_ooxml(data), mime
        else:
            return data, mime
    except Exception as e:
        logger.warning(f"Не удалось сжать вложение {mime}: {e}")
        return data, mime
    return (result, result_mime) if len(result) < len(data) else (data, mime)


def prepare_attachment(data_url: str) -> str:
    """Проверяет формат, сжимает и возвращает data URL с настоящим MIME."""
    data = _decode(data_url)
    mime = _detect_mime(data)
    if not _is_allowed(mime):
        raise HTTPException(415, f"Формат файла не поддерживается: {mime}")

    data, mime = _compress(data, mime)
    if len(data) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(413, "Файл больше 10 МБ даже после сжатия")

    return f"data:{mime};base64,{base64.b64encode(data).decode()}"


def prepare_attachments(data_urls: list[str]) -> list[str]:
    return [prepare_attachment(url) for url in data_urls]


def mail_attachments(data_urls: list[str]) -> list[dict]:
    """Вложения для письма из уже подготовленных data URL."""
    result = []
    for i, url in enumerate(data_urls, 1):
        header, b64 = url.split(",", 1)
        mime = header.removeprefix("data:").split(";", 1)[0]
        ext = EXTENSIONS.get(mime) or mimetypes.guess_extension(mime) or ".bin"
        prefix = "photo" if mime.startswith("image/") else "file"
        result.append({"data": b64, "filename": f"{prefix}_{i}{ext}", "mime": mime})
    return result
