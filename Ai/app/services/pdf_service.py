import os
import uuid
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import fitz

logger = logging.getLogger(__name__)

DIAGRAM_STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage", "diagrams"))
os.makedirs(DIAGRAM_STORAGE_DIR, exist_ok=True)


def _save_diagram_image(img_bytes: bytes, prefix: str = "diag", ext: str = "png") -> str:
    """Lưu ảnh sơ đồ/trang scan vào thư mục storage để phục vụ Visual Grounding."""
    filename = f"{prefix}_{uuid.uuid4().hex[:12]}.{ext}"
    full_path = os.path.join(DIAGRAM_STORAGE_DIR, filename)
    try:
        with open(full_path, "wb") as f:
            f.write(img_bytes)
        return full_path
    except Exception as e:
        logger.warning(f"Không thể lưu ảnh sơ đồ vào {full_path}: {e}")
        return ""


class PdfService:

    # =========================================================
    # EXTRACT TEXT & DIAGRAMS (PDF có text layer hoặc scanned)
    # =========================================================

    def extract_text(self, path: str, vision_service=None) -> str:
        """
        Extract text trực tiếp từ PDF có text layer, kết hợp diễn giải sơ đồ / luồng quy trình nếu có vision_service.
        Trả về chuỗi rỗng nếu PDF scanned (không có text).
        """
        try:
            with fitz.open(path) as doc:
                total_pages = len(doc)
                pages_data = []

                # 1. Trích xuất text cơ bản theo từng trang
                for page_idx, page in enumerate(doc):
                    text = page.get_text().strip()
                    pages_data.append({
                        "index": page_idx,
                        "text": text,
                        "diagrams": []
                    })

                # 2. Nhận diện và diễn giải sơ đồ / luồng hoạt động qua Multimodal Vision song song
                if vision_service:
                    def _process_page_vision(page_idx):
                        try:
                            with fitz.open(path) as inner_doc:
                                inner_page = inner_doc[page_idx]
                                return page_idx, self._extract_diagrams_from_page(inner_doc, inner_page, page_idx, vision_service)
                        except Exception as p_err:
                            logger.warning("Lỗi xử lý vision trang %d: %s", page_idx + 1, p_err)
                            return page_idx, []

                    max_workers = min(3, total_pages) if total_pages > 0 else 1
                    with ThreadPoolExecutor(max_workers=max_workers) as executor:
                        futures = [executor.submit(_process_page_vision, i) for i in range(total_pages)]
                        for future in as_completed(futures):
                            idx, diagrams = future.result()
                            if diagrams:
                                pages_data[idx]["diagrams"] = diagrams

                parts = []
                for p_info in pages_data:
                    page_parts = []
                    if p_info["text"]:
                        page_parts.append(p_info["text"])
                    if p_info["diagrams"]:
                        page_parts.extend(p_info["diagrams"])
                    if page_parts:
                        parts.append("\n\n".join(page_parts))

                return "\n\n".join(parts)

        except fitz.FileDataError as exc:
            raise ValueError(f"File không phải PDF hợp lệ: {path}") from exc
        except Exception as exc:
            raise RuntimeError(f"Lỗi khi đọc PDF: {path}") from exc

    def _extract_diagrams_from_page(self, doc, page, page_idx: int, vision_service) -> list:
        """
        Trích xuất hình ảnh hoặc vector graphics từ trang PDF và gửi tới VisionService để diễn giải luồng.
        Đồng thời lưu trữ ảnh gốc để phục vụ Visual Grounding khi Chatbot trả lời.
        """
        diagram_texts = []
        try:
            # 1. Quét các hình ảnh nhúng (raster images)
            images = page.get_images(full=True)
            for img_info in images:
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    img_bytes = base_image.get("image")
                    img_ext = base_image.get("ext", "png")
                    width = base_image.get("width", 0)
                    height = base_image.get("height", 0)

                    # Bỏ qua icon, logo, thanh kẻ kích thước nhỏ
                    if width < 120 or height < 120:
                        continue

                    mime_type = "image/jpeg" if img_ext in ["jpg", "jpeg"] else "image/png"
                    desc = vision_service.analyze_diagram_image(img_bytes, mime_type=mime_type)
                    if desc and desc.strip():
                        saved_img_path = _save_diagram_image(img_bytes, prefix=f"p{page_idx + 1}", ext=img_ext)
                        path_tag = f" | IMAGE_PATH: {saved_img_path}" if saved_img_path else ""
                        diagram_texts.append(
                            f"\n--- [DIỄN GIẢI SƠ ĐỒ / LUỒNG QUY TRÌNH HÌNH ẢNH - TRANG {page_idx + 1}{path_tag}] ---\n"
                            f"{desc.strip()}\n"
                            f"---------------------------------------------------------\n"
                        )
                except Exception as img_err:
                    logger.debug(f"Không thể trích xuất ảnh xref {xref} tại trang {page_idx + 1}: {img_err}")

            # 2. Nếu không có ảnh raster nhưng trang có nhiều nét vẽ đồ họa vector (flowchart vẽ bằng shapes)
            if not images:
                drawings = page.get_drawings()
                if len(drawings) >= 8:
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    desc = vision_service.analyze_diagram_image(img_bytes, mime_type="image/png")
                    if desc and desc.strip():
                        saved_img_path = _save_diagram_image(img_bytes, prefix=f"vector_p{page_idx + 1}", ext="png")
                        path_tag = f" | IMAGE_PATH: {saved_img_path}" if saved_img_path else ""
                        diagram_texts.append(
                            f"\n--- [DIỄN GIẢI SƠ ĐỒ / LUỒNG QUY TRÌNH VECTOR - TRANG {page_idx + 1}{path_tag}] ---\n"
                            f"{desc.strip()}\n"
                            f"---------------------------------------------------------\n"
                        )

        except Exception as e:
            logger.warning(f"Lỗi khi trích xuất sơ đồ tại trang {page_idx + 1}: {e}")

        return diagram_texts

    # =========================================================
    # OCR PDF (PDF scanned)
    # =========================================================

    def ocr_pdf(self, path: str, ocr_service, vision_service=None) -> str:
        """
        Render từng trang PDF thành ảnh rồi đọc bằng chiến lược Vision-First (chính xác cao nhất).
        Lưu ảnh từng trang để hỗ trợ Visual Grounding khi người dùng hỏi về trang scan đó.
        """
        try:
            with fitz.open(path) as doc:
                total_pages = len(doc)
                if total_pages == 0:
                    return ""

                def _ocr_single_page(page_num):
                    try:
                        with fitz.open(path) as inner_doc:
                            page = inner_doc[page_num]
                            mat = fitz.Matrix(2.0, 2.0)
                            pix = page.get_pixmap(matrix=mat)
                            img_bytes = pix.tobytes("png")

                            saved_img_path = _save_diagram_image(img_bytes, prefix=f"scan_p{page_num + 1}", ext="png")
                            path_tag = f" | IMAGE_PATH: {saved_img_path}" if saved_img_path else ""

                            # 1. Ưu tiên Vision LLM (vừa đọc chữ vừa phân tích cấu trúc)
                            if vision_service:
                                desc = vision_service.analyze_diagram_image(img_bytes, mime_type="image/png")
                                if desc and desc.strip():
                                    return page_num, (
                                        f"--- [NỘI DUNG & DIỄN GIẢI TRANG {page_num + 1}{path_tag}] ---\n"
                                        f"{desc.strip()}\n"
                                        f"---------------------------------------------------------"
                                    )

                            # 2. Fallback sang EasyOCR nếu Vision không thành công
                            if ocr_service:
                                text = ocr_service.extract_text_from_bytes(img_bytes)
                                if text and text.strip():
                                    return page_num, f"[Trang {page_num + 1}{path_tag}]\n{text.strip()}"

                            return page_num, ""
                    except Exception as err:
                        logger.warning("Lỗi xử lý trang scan %d: %s", page_num + 1, err)
                        return page_num, ""

                results = [None] * total_pages
                max_workers = min(3, total_pages)
                with ThreadPoolExecutor(max_workers=max_workers) as executor:
                    futures = [executor.submit(_ocr_single_page, i) for i in range(total_pages)]
                    for future in as_completed(futures):
                        p_num, p_text = future.result()
                        results[p_num] = p_text

                parts = [res for res in results if res and res.strip()]
                return "\n\n".join(parts)

        except fitz.FileDataError as exc:
            raise ValueError(f"File không phải PDF hợp lệ: {path}") from exc
        except Exception as exc:
            raise RuntimeError(f"Lỗi khi OCR PDF: {path}") from exc
