import email
import logging
import tempfile
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import boto3
import requests
from docx import Document

from app.services.pdf_service import PdfService
from app.services.ocr_service import OCRService

logger = logging.getLogger(__name__)


class DocumentReader:
    """
    Đọc nội dung text từ nhiều loại file khác nhau.
    Hỗ trợ: PDF (text + scanned), IMAGE, DOCX, EMAIL (.eml / .msg)
    Hỗ trợ nguồn: local path, S3 URI (s3://bucket/key), HTTP(S) URL
    """

    SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".docx", ".eml", ".msg"}

    def __init__(self):
        self.pdf_service = PdfService()
        self.ocr_service = OCRService()

    # =========================================================
    # PUBLIC
    # =========================================================

    def read(self, file_path: str) -> str:
        """
        Nhận vào local path, S3 URI hoặc HTTP(S) URL, trả về nội dung text.
        Temp file (nếu download) sẽ được dọn dẹp tự động.
        """
        is_remote = file_path.startswith(("s3://", "http://", "https://"))
        local_path = self._resolve_file(file_path)

        try:
            return self._dispatch(local_path, original_path=file_path)
        finally:
            if is_remote:
                self._cleanup(local_path)

    # =========================================================
    # DISPATCH
    # =========================================================

    def _dispatch(self, file_path: str, original_path: str) -> str:
        # Lấy extension từ path gốc (trước khi resolve) để tránh temp file
        # không có suffix làm sai lệch việc detect loại file.
        ext = Path(urlparse(original_path).path).suffix.lower()

        if ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file type: {ext}")

        if ext == ".pdf":
            return self._read_pdf(file_path)
        if ext in {".png", ".jpg", ".jpeg", ".webp", ".tiff"}:
            return self._read_image(file_path)
        if ext == ".docx":
            return self._read_docx(file_path)
        if ext in {".eml", ".msg"}:
            return self._read_email(file_path)

        raise ValueError(f"Unsupported file type: {ext}")

    # =========================================================
    # PDF
    # =========================================================

    def _read_pdf(self, file_path: str) -> str:
        text = self.pdf_service.extract_text(file_path)
        if text and text.strip():
            return text

        logger.warning("PDF không có text layer, fallback sang OCR: %s", file_path)
        return self.pdf_service.ocr_pdf(file_path, self.ocr_service)

    # =========================================================
    # IMAGE
    # =========================================================

    def _read_image(self, file_path: str) -> str:
        return self.ocr_service.extract_text(file_path)

    # =========================================================
    # DOCX
    # =========================================================

    def _read_docx(self, file_path: str) -> str:
        """
        Đọc cả paragraphs lẫn nội dung trong bảng (tables),
        giữ đúng thứ tự xuất hiện trong tài liệu gốc.
        file_path ở đây luôn là local path (đã được _resolve_file xử lý).
        """
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        doc = Document(BytesIO(file_bytes))
        parts = []
        body = doc.element.body

        for child in body.iterchildren():
            tag = child.tag.split("}")[-1]

            if tag == "p":
                for p in doc.paragraphs:
                    if p._element is child:
                        text = p.text.strip()
                        if text:
                            parts.append(text)
                        break

            elif tag == "tbl":
                for table in doc.tables:
                    if table._element is child:
                        for row in table.rows:
                            row_text = " | ".join(
                                cell.text.strip()
                                for cell in row.cells
                                if cell.text.strip()
                            )
                            if row_text:
                                parts.append(row_text)
                        break

        return "\n".join(parts)

    # =========================================================
    # EMAIL
    # =========================================================

    def _read_email(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            msg = email.message_from_file(f)

        parts = []
        subject = msg.get("subject")
        if subject:
            parts.append(f"Subject: {subject}")

        sender = msg.get("from")
        if sender:
            parts.append(f"From: {sender}")

        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        parts.append(payload.decode(errors="ignore"))
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                parts.append(payload.decode(errors="ignore"))

        return "\n".join(parts)

    # =========================================================
    # FILE RESOLUTION (local / S3 / HTTP)
    # =========================================================

    def _resolve_file(self, file_path: str) -> str:
        """
        - Local path → trả về nguyên bản.
        - S3 URI (s3://bucket/key) → download về temp file qua boto3.
        - HTTP(S) URL → download về temp file qua requests.
        """
        if file_path.startswith("s3://"):
            return self._download_from_s3(file_path)

        if file_path.startswith(("http://", "https://")):
            return self._download_from_url(file_path)

        return file_path

    def _download_from_s3(self, file_path: str) -> str:
        parsed = urlparse(file_path)
        bucket = parsed.netloc
        key = parsed.path.lstrip("/")
        suffix = Path(key).suffix

        logger.debug("Downloading s3://%s/%s ...", bucket, key)

        s3 = boto3.client("s3")
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_file.close()

        try:
            s3.download_file(bucket, key, tmp_file.name)
        except Exception as exc:
            self._cleanup(tmp_file.name)
            raise RuntimeError(f"Không thể download file từ S3: {file_path}") from exc

        return tmp_file.name

    def _download_from_url(self, file_path: str) -> str:
        suffix = Path(urlparse(file_path).path).suffix

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_file.close()

        try:
            response = requests.get(file_path, timeout=30)
            response.raise_for_status()
            with open(tmp_file.name, "wb") as f:
                f.write(response.content)
        except Exception as exc:
            self._cleanup(tmp_file.name)
            raise RuntimeError(f"Không thể download file từ URL: {file_path}") from exc

        return tmp_file.name

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _cleanup(file_path: str) -> None:
        try:
            Path(file_path).unlink(missing_ok=True)
        except Exception:
            logger.warning("Không thể xóa temp file: %s", file_path)