import logging
from pathlib import Path

import fitz

logger = logging.getLogger(__name__)


class PdfService:

    # =========================================================
    # EXTRACT TEXT (PDF có text layer)
    # =========================================================

    def extract_text(self, path: str) -> str:
        """
        Extract text trực tiếp từ PDF có text layer.
        Trả về chuỗi rỗng nếu PDF scanned (không có text).
        """
        try:
            with fitz.open(path) as doc:
                parts = []
                for page in doc:
                    text = page.get_text().strip()
                    if text:
                        parts.append(text)
                return "\n".join(parts)

        except fitz.FileDataError as exc:
            raise ValueError(f"File không phải PDF hợp lệ: {path}") from exc
        except Exception as exc:
            raise RuntimeError(f"Lỗi khi đọc PDF: {path}") from exc

    # =========================================================
    # OCR PDF (PDF scanned)
    # =========================================================

    def ocr_pdf(self, path: str, ocr_service) -> str:
        """
        Render từng trang PDF thành ảnh rồi chạy OCR.
        Dùng khi PDF không có text layer (scanned document).
        """
        try:
            with fitz.open(path) as doc:
                parts = []
                for page_num, page in enumerate(doc):
                    logger.debug("OCR page %d/%d: %s", page_num + 1, len(doc), Path(path).name)

                    # Render page → ảnh (độ phân giải 2x cho OCR chính xác hơn)
                    mat = fitz.Matrix(2.0, 2.0)
                    pix = page.get_pixmap(matrix=mat)
                    img_bytes = pix.tobytes("png")

                    text = ocr_service.extract_text_from_bytes(img_bytes)
                    if text and text.strip():
                        parts.append(text.strip())

                return "\n".join(parts)

        except fitz.FileDataError as exc:
            raise ValueError(f"File không phải PDF hợp lệ: {path}") from exc
        except Exception as exc:
            raise RuntimeError(f"Lỗi khi OCR PDF: {path}") from exc