import os
import io
import time
import logging
from typing import Optional
from PIL import Image
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types
from app.utils.retry import retry

logger = logging.getLogger(__name__)

UNIVERSAL_VISION_PROMPT = """Bạn là trợ lý AI chuyên gia thị giác máy tính và phân tích tài liệu đa phương tiện cấp cao (High-Precision Multimodal Document Specialist).
Nhiệm vụ của bạn là quan sát kỹ lưỡng bức ảnh/trang tài liệu này và chuyển đổi TOÀN BỘ thông tin trực quan, chữ viết, cấu trúc và quan hệ logic thành văn bản Markdown có cấu trúc chuẩn xác nhất để hệ thống RAG lập chỉ mục và trả lời câu hỏi của người dùng.

### QUY TẮC PHÂN TÍCH VÀ ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC TUÂN THỦ):

1. **NẾU LÀ SƠ ĐỒ QUY TRÌNH / FLOWCHART / LUỒNG HOẠT ĐỘNG / CÂY MÔN HỌC / BPMN / TIMELINE**:
   Trình bày theo cấu trúc chuẩn sau:
   ### [SƠ ĐỒ QUY TRÌNH]: <Tên quy trình hoặc tiêu đề sơ đồ>
   - **Mục tiêu / Ý nghĩa tổng quát**: <Mô tả ngắn gọn 1-2 câu>
   - **Trình tự các bước tuần tự (Sequence Flow)**:
     1. Bước 1: [<Tên bước>] - Chi tiết hành động / Đối tượng thực hiện -> Đi tiếp tới Bước 2
     2. Bước 2: [<Tên bước>] - Chi tiết hành động / Đối tượng thực hiện -> Đi tiếp tới Bước 3
     ...
   - **Các điểm rẽ nhánh & Điều kiện quyết định (Decision & Branches)**:
     - Nếu [Điều kiện/Trường hợp A]: Chuyển sang Bước X
     - Nếu [Điều kiện/Trường hợp B]: Chuyển sang Bước Y
   - **Mối quan hệ tiên quyết / Ràng buộc (nếu có cây môn học / lộ trình đào tạo)**:
     - Ghi rõ: Môn học tiên quyết, môn học trước, số tín chỉ, điều kiện song hành của từng môn.
   - **Chữ nguyên văn đọc được trong sơ đồ (Raw Text Transcription)**:
     "<Trích xuất nguyên văn toàn bộ các nhãn chữ, ghi chú xuất hiện trên hình>"

2. **NẾU LÀ BẢNG BIỂU / BÁO CÁO / HÓA ĐƠN / DANH SÁCH HỌC PHẦN (TABLE / DATA SHEET)**:
   - **BẮT BUỘC CHUYỂN TOÀN BỘ DỮ LIỆU THÀNH BẢNG MARKDOWN CHUẨN** (`| Cột 1 | Cột 2 | Cột 3 |`).
   - Giữ nguyên vẹn tất cả các hàng, cột, tiêu đề, mã số, số liệu, đơn vị tính, không được bỏ sót bất kỳ dòng nào.
   - Sau bảng, ghi chú thêm các thông tin tóm tắt tổng cộng, ghi chú chân trang nếu có.

3. **NẾU LÀ BIỂU ĐỒ THỐNG KÊ / ĐỒ THỊ (CHART / GRAPH / DASHBOARD)**:
   - **Loại biểu đồ**: Cột / Đường / Bánh tròn / Radar...
   - **Tiêu đề & Trục**: Trục X (thời gian/danh mục), Trục Y (đơn vị đo).
   - **Dữ liệu chi tiết**: Liệt kê từng mốc số liệu cụ thể, tỷ lệ phần trăm (%), xu hướng tăng/giảm chính.

4. **NẾU LÀ SƠ ĐỒ KIẾN TRÚC KỸ THUẬT / HẠ TẦNG / DATABASE (ARCHITECTURE / ERD / NETWORK)**:
   - Liệt kê các module, service, cơ sở dữ liệu, giao thức kết nối (HTTP, gRPC, WebSocket...), chiều mũi tên tương tác.

5. **NẾU LÀ TÀI LIỆU CHỮ / VĂN BẢN SCAN / ẢNH CHỤP TRANG SÁCH**:
   - Trích xuất toàn bộ nội dung chữ (OCR) đầy đủ, chính xác từng từ ngữ, đoạn văn, danh sách gạch đầu dòng theo đúng bố cục ban đầu.

6. **NẾU LÀ BIỂU TƯỢNG TRANG TRÍ HOẶC KHÔNG CHỨA THÔNG TIN**:
   - Ghi ngắn gọn: [Biểu tượng trang trí]

Diễn giải bằng tiếng Việt rõ ràng, giữ trọn vẹn mọi con số, mã số, tên riêng và liên kết logic để AI có căn cứ chính xác 100% khi trả lời.
"""


class VisionService:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("Thiếu biến môi trường GEMINI_API_KEY cho VisionService")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model = os.environ.get("GEMINI_VISION_MODEL") or os.environ.get("GEMINI_MODEL") or "gemini-3.1-flash-lite"

    def analyze_diagram_image(self, image_bytes: bytes, mime_type: str = "image/png") -> Optional[str]:
        """
        Gửi ảnh sang Gemini Multimodal Vision để diễn giải mọi loại hình ảnh
        (sơ đồ quy trình, bảng biểu, đồ thị, văn bản scan...) thành văn bản Markdown có cấu trúc chuẩn xác.
        """
        if not self.client:
            return None

        try:
            # Kiểm tra kích thước ảnh (bỏ qua ảnh quá nhỏ < 80x80 như bullet point, icon)
            try:
                img = Image.open(io.BytesIO(image_bytes))
                width, height = img.size
                if width < 80 or height < 80:
                    logger.debug(f"Bỏ qua ảnh icon/divider quá nhỏ ({width}x{height})")
                    return None
            except Exception as e:
                logger.debug(f"Không thể mở ảnh bằng PIL: {e}")

            # Chuẩn bị Part từ image bytes
            image_part = types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            )

            # Danh sách model thử nghiệm theo thứ tự ưu tiên
            models_to_try = [
                self.model,
                "gemini-2.5-flash",
                "gemini-1.5-flash",
                "gemini-3.1-flash-lite"
            ]
            seen = set()
            unique_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

            for model_name in unique_models:
                try:
                    response = retry(
                        lambda: self.client.models.generate_content(
                            model=model_name,
                            contents=[
                                image_part,
                                UNIVERSAL_VISION_PROMPT
                            ]
                        ),
                        max_retry=2
                    )

                    if response and response.text and response.text.strip():
                        result = response.text.strip()
                        # Bỏ qua nếu chỉ là biểu tượng trang trí
                        if "[Biểu tượng trang trí]" in result and len(result) < 60:
                            logger.info("Bỏ qua ảnh biểu tượng trang trí không mang thông tin.")
                            return None
                        return result

                except Exception as model_err:
                    err_msg = str(model_err)
                    logger.warning(f"Vision model {model_name} gặp vấn đề ({err_msg}). Đang thử giải pháp tiếp theo...")
                    if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                        # Tạm dừng 2 giây trước khi thử model tiếp theo để tránh bão request
                        time.sleep(2)
                    continue

            return None

        except Exception as e:
            logger.error(f"Lỗi khi phân tích hình ảnh qua VisionService: {e}")
            return None
