import logging
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import boto3
from docling.document_converter import DocumentConverter

logger = logging.getLogger(__name__)


class DocumentReader:
    """
    Đọc nội dung text từ nhiều loại file.
    Hỗ trợ: PDF, DOCX, PPTX, XLSX, HTML, EML, MSG, Images, ...
    Hỗ trợ nguồn: local path, S3 URI (s3://bucket/key)
    """

    def __init__(self):
        self.converter = DocumentConverter()

    def read(self, file_path: str) -> str:
        is_s3 = file_path.startswith("s3://")
        local_path = self._resolve_file(file_path)

        try:
            result = self.converter.convert(local_path)
            return result.document.export_to_markdown()
        except Exception as exc:
            raise RuntimeError(f"Không thể đọc file: {local_path}") from exc
        finally:
            if is_s3:
                self._cleanup(local_path)

    def _resolve_file(self, file_path: str) -> str:
        if not file_path.startswith("s3://"):
            return file_path

        parsed = urlparse(file_path)
        bucket = parsed.netloc
        key = parsed.path.lstrip("/")
        suffix = Path(key).suffix

        s3 = boto3.client("s3")
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        tmp_file.close()

        try:
            s3.download_file(bucket, key, tmp_file.name)
        except Exception as exc:
            self._cleanup(tmp_file.name)
            raise RuntimeError(f"Không thể download từ S3: {file_path}") from exc

        return tmp_file.name

    @staticmethod
    def _cleanup(file_path: str) -> None:
        try:
            Path(file_path).unlink(missing_ok=True)
        except Exception:
            logger.warning("Không thể xóa temp file: %s", file_path)