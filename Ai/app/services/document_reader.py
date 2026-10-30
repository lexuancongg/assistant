import os
import email
import logging
import tempfile
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import boto3
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from docx import Document
from openpyxl import load_workbook
from xlrd import open_workbook

from app.services.pdf_service import PdfService, _save_diagram_image
from app.services.ocr_service import OCRService
from app.services.vision_service import VisionService

logger = logging.getLogger(__name__)


class DocumentReader:
    """
    Đọc nội dung text từ nhiều loại file khác nhau.
    Hỗ trợ: PDF (text + scanned), IMAGE, DOCX, EMAIL (.eml / .msg)
    Hỗ trợ nguồn: local path, S3 URI (s3://bucket/key), HTTP(S) URL
    """

    SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".docx", ".xlsx", ".xls", ".eml", ".msg"}

    def __init__(self):
        self.pdf_service = PdfService()
        self.ocr_service = OCRService()
        self.vision_service = VisionService()

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
        if ext in {".xlsx", ".xls"}:
            return self._read_excel(file_path)
        if ext in {".eml", ".msg"}:
            return self._read_email(file_path)

        raise ValueError(f"Unsupported file type: {ext}")

    # =========================================================
    # PDF
    # =========================================================

    def _read_pdf(self, file_path: str) -> str:
        text = self.pdf_service.extract_text(file_path, vision_service=self.vision_service)
        if text and text.strip():
            return text

        logger.warning("PDF không có text layer, fallback sang OCR: %s", file_path)
        return self.pdf_service.ocr_pdf(file_path, self.ocr_service, vision_service=self.vision_service)

    # =========================================================
    # IMAGE
    # =========================================================

    def _read_image(self, file_path: str) -> str:
        """
        Đọc nội dung file ảnh với độ chuẩn xác tối đa (Vision-First Strategy):
        1. Ưu tiên phân tích sâu qua Multimodal Vision (nhận diện cả chữ, bảng biểu Markdown và sơ đồ logic).
        2. Fallback sang EasyOCR nếu Vision API gặp sự cố hoặc offline.
        Lưu vết đường dẫn ảnh để hỗ trợ Visual Grounding khi người dùng hỏi.
        """
        path_tag = f" | IMAGE_PATH: {os.path.abspath(file_path)}"
        # 1. Thử phân tích qua Vision LLM trước (Vision-First Strategy)
        try:
            with open(file_path, "rb") as f:
                img_bytes = f.read()
            ext = Path(file_path).suffix.lower().lstrip(".")
            mime_type = "image/jpeg" if ext in ["jpg", "jpeg"] else f"image/{ext}"
            vision_desc = self.vision_service.analyze_diagram_image(img_bytes, mime_type=mime_type)
            if vision_desc and vision_desc.strip():
                return (
                    f"--- [NỘI DUNG & DIỄN GIẢI HÌNH ẢNH / SƠ ĐỒ{path_tag}] ---\n"
                    f"{vision_desc.strip()}\n"
                    f"---------------------------------------------------------"
                )
        except Exception as e:
            logger.warning(f"Lỗi khi diễn giải hình ảnh qua VisionService {file_path}: {e}")

        # 2. Fallback sang EasyOCR cục bộ nếu Vision không thành công
        logger.info(f"Fallback sang EasyOCR cục bộ cho ảnh: {file_path}")
        ocr_text = self.ocr_service.extract_text(file_path)
        if ocr_text and ocr_text.strip():
            return f"--- [NỘI DUNG HÌNH ẢNH OCR{path_tag}] ---\n{ocr_text.strip()}\n---------------------------------------------------------"
        return ""

    # =========================================================
    # DOCX
    # =========================================================

    def _read_docx(self, file_path: str) -> str:
        """
        Đọc cả paragraphs lẫn nội dung trong bảng (tables),
        và diễn giải hình ảnh sơ đồ quy trình đính kèm trong docx.
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

        # Diễn giải các hình ảnh nhúng trong file docx (nếu có sơ đồ quy trình)
        try:
            for rel in doc.part.rels.values():
                if "image" in rel.target_ref:
                    img_part = rel.target_part
                    img_bytes = img_part.blob
                    ext = Path(rel.target_ref).suffix.lower().lstrip(".")
                    mime_type = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
                    desc = self.vision_service.analyze_diagram_image(img_bytes, mime_type=mime_type)
                    if desc and desc.strip():
                        saved_img_path = _save_diagram_image(img_bytes, prefix="docx_diag", ext=ext or "png")
                        path_tag = f" | IMAGE_PATH: {saved_img_path}" if saved_img_path else ""
                        parts.append(
                            f"\n--- [DIỄN GIẢI SƠ ĐỒ / LUỒNG HOẠT ĐỘNG TỪ TÀI LIỆU DOCX{path_tag}] ---\n"
                            f"{desc.strip()}\n"
                            f"-------------------------------------------------------------\n"
                        )
        except Exception as e:
            logger.debug(f"Không thể phân tích ảnh nhúng trong docx: {e}")

        return "\n".join(parts)

    # =========================================================
    # EXCEL
    # =========================================================

    def _read_excel(self, file_path: str) -> str:
        parts = []
        try:
            workbook = load_workbook(filename=file_path, read_only=True, data_only=True)
            for sheet in workbook.worksheets:
                parts.append(f"Sheet: {sheet.title}")
                for row in sheet.iter_rows(values_only=True):
                    row_text = " | ".join(
                        str(cell).strip()
                        for cell in row
                        if cell is not None and str(cell).strip()
                    )
                    if row_text:
                        parts.append(row_text)
        except Exception:
            workbook = open_workbook(file_path)
            for sheet in workbook.sheets():
                parts.append(f"Sheet: {sheet.name}")
                for row_idx in range(sheet.nrows):
                    row_values = sheet.row_values(row_idx)
                    row_text = " | ".join(
                        str(cell).strip()
                        for cell in row_values
                        if cell is not None and str(cell).strip()
                    )
                    if row_text:
                        parts.append(row_text)

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
        - Local path → nếu tồn tại trên đĩa thì trả về nguyên bản.
        - S3 URI (s3://bucket/key) hoặc S3 Key (docs/...) → download về temp file qua boto3.
        - HTTP(S) URL → download về temp file qua requests.
        """
        if file_path.startswith("s3://"):
            return self._download_from_s3(file_path)

        if file_path.startswith(("http://", "https://")):
            return self._download_from_url(file_path)

        if not os.path.exists(file_path):
            return self._download_from_s3(file_path)

        return file_path

    def _download_from_s3(self, file_path: str) -> str:
        if file_path.startswith("s3://"):
            parsed = urlparse(file_path)
            bucket = parsed.netloc
            key = parsed.path.lstrip("/")
        else:
            bucket = os.environ.get("AWS_S3_BUCKET", "employ-management")
            key = file_path.lstrip("/")

        suffix = Path(key).suffix

        logger.debug("Downloading s3://%s/%s ...", bucket, key)

        s3 = boto3.client(
            "s3",
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
            region_name=os.environ.get("AWS_REGION", "us-east-1")
        )
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_file.close()

        try:
            s3.download_file(bucket, key, tmp_file.name)
        except Exception as exc:
            self._cleanup(tmp_file.name)
            raise RuntimeError(f"Không thể download file từ S3 (bucket={bucket}, key={key}): {file_path}") from exc

        return tmp_file.name

    def _download_from_url(self, file_path: str) -> str:
        import time
        suffix = Path(urlparse(file_path).path).suffix

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_file.close()

        max_attempts = 3
        last_error = None
        headers = {"User-Agent": "EnterpriseAI/1.0"}

        for attempt in range(1, max_attempts + 1):
            try:
                response = requests.get(file_path, timeout=(20, 60), headers=headers)
                response.raise_for_status()
                with open(tmp_file.name, "wb") as f:
                    f.write(response.content)
                return tmp_file.name
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Lần tải file thứ %d/%d thất bại (%s): %s. Đang thử lại...",
                    attempt, max_attempts, file_path, exc
                )
                time.sleep(attempt * 1.5)

        self._cleanup(tmp_file.name)
        raise RuntimeError(f"Không thể download file từ URL sau {max_attempts} lần thử: {file_path}") from last_error

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _cleanup(file_path: str) -> None:
        try:
            Path(file_path).unlink(missing_ok=True)
        except Exception:
            logger.warning("Không thể xóa temp file: %s", file_path)
