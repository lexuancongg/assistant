import os
import io
import logging
from typing import Optional
from PIL import Image
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

UNIVERSAL_VISION_PROMPT = """Bạn là trợ lý AI chuyên gia thị giác máy tính và phân tích nội dung tài liệu.
Nhiệm vụ của bạn là quan sát kỹ lưỡng bức ảnh này và diễn giải chi tiết toàn bộ nội dung, ngữ nghĩa và thông tin trực quan để hệ thống RAG có thể lập chỉ mục (index) và trả lời bất kỳ câu hỏi nào của người dùng về bức ảnh này.

Hãy phân tích và mô tả chi tiết theo các trường hợp tương ứng:

1. NẾU LÀ SƠ ĐỒ QUY TRÌNH / LUỒNG HOẠT ĐỘNG / CÂY MÔN HỌC / ĐIỀU KIỆN TIÊN QUYẾT (FLOWCHART / CURRICULUM TREE / BPMN / TIMELINE):
   - Tên sơ đồ / Tên quy trình / Tên chương trình đào tạo.
   - Danh sách các môn học, khối kiến thức, số tín chỉ tương ứng của từng môn.
   - Mối quan hệ điều kiện học phần (Ví dụ: Để học môn B/Thị giác máy tính thì bắt buộc phải học trước môn A/Trí tuệ nhân tạo, điều kiện tiên quyết, điều kiện song hành...).
   - Trình tự tuần tự các bước (Bước 1 -> Bước 2 -> Bước 3...).
   - Các điều kiện rẽ nhánh (Nếu Có/Không, Đạt/Không đạt thì chuyển tiếp sang đâu).

2. NẾU LÀ SƠ ĐỒ KIẾN TRÚC KỸ THUẬT / HẠ TẦNG / DATABASE (ARCHITECTURE / NETWORK / ERD):
   - Các thành phần, module, server, service, cơ sở dữ liệu.
   - Mối quan hệ kết nối, giao thức (HTTP, gRPC, TCP...), chiều mũi tên tương tác giữa các bên.

3. NẾU LÀ BIỂU ĐỒ THỐNG KÊ / ĐỒ THỊ (CHART / GRAPH / DASHBOARD):
   - Loại biểu đồ (Cột, đường, bánh tròn...).
   - Tiêu đề, các trục tọa độ (Trục X, Trục Y, đơn vị đo).
   - Chi tiết các mốc số liệu cụ thể, tỷ lệ phần trăm, các hạng mục so sánh.

4. NẾU LÀ BẢNG DỮ LIỆU / BÁO CÁO / HÓA ĐƠN / CHỨNG TỪ / CHƯƠNG TRÌNH ĐÀO TẠO:
   - Trích xuất toàn bộ dữ liệu theo từng dòng, cột, tiêu đề, mã môn học, số tín chỉ, lý thuyết, thực hành, tổng số tín chỉ.

5. NẾU LÀ GIAO DIỆN NGƯỜI DÙNG / ẢNH CHỤP MÀN HÌNH (UI/UX / SCREENSHOT):
   - Tên màn hình / Ứng dụng, danh sách các nút bấm, ô nhập liệu, thông báo hiển thị trên màn hình.

6. NẾU LÀ TÀI LIỆU CHỮ / VĂN BẢN / ẢNH CHỤP TRANG SÁCH / PDF SCANNED:
   - Trích xuất toàn bộ nội dung chữ (OCR) đầy đủ, chính xác từng từ, từng câu.

7. NẾU CHỈ LÀ ICON, LOGO TRANG TRÍ HOẶC KHÔNG CHỨA BẤT KỲ THÔNG TIN NÀO:
   - Ghi ngắn gọn đúng 1 dòng: [Biểu tượng trang trí]

Diễn giải bằng tiếng Việt rõ ràng, đầy đủ các chi tiết số liệu, tên môn học, số tín chỉ, mối quan hệ học trước/tiên quyết để khi người dùng hỏi bất kỳ chi tiết nào về ảnh/sơ đồ, AI đều có căn cứ chính xác để trả lời.
"""

from dotenv import load_dotenv
load_dotenv()
from app.utils.retry import retry

class VisionService:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("Thiếu biến môi trường GEMINI_API_KEY cho VisionService")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.model = os.environ.get("GEMINI_VISION_MODEL") or os.environ.get("GEMINI_MODEL") or "gemini-3.1-flash-lite"
        self._quota_exhausted = False

    def analyze_diagram_image(self, image_bytes: bytes, mime_type: str = "image/png") -> Optional[str]:
        """
        Gửi ảnh sang Gemini Multimodal Vision để diễn giải mọi loại hình ảnh
        (sơ đồ, biểu đồ, kiến trúc, UI/UX, sản phẩm, bảng biểu, ảnh chụp thực tế...) thành văn bản có cấu trúc.
        """
        if not self.client or self._quota_exhausted:
            return None

        try:
            # Kiểm tra kích thước ảnh (bỏ qua ảnh quá nhỏ < 100x100 như bullet point, divider)
            try:
                img = Image.open(io.BytesIO(image_bytes))
                width, height = img.size
                if width < 100 or height < 100:
                    logger.debug(f"Bỏ qua ảnh quá nhỏ ({width}x{height})")
                    return None
            except Exception as e:
                logger.debug(f"Không thể mở ảnh bằng PIL: {e}")

            # Chuẩn bị Part từ image bytes
            image_part = types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type
            )

            # Sử dụng chính xác model được cấu hình bởi người dùng (hoặc fallback nếu lỗi)
            models_to_try = [self.model, "gemini-3.1-flash-lite"]
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
                        )
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
                    if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower() or "429" in err_msg:
                        logger.warning("Gemini Vision API đã chạm giới hạn Quota ngày của Free Tier. Tự động bỏ qua vision cho các ảnh còn lại.")
                        self._quota_exhausted = True
                        break
                    logger.warning(f"Vision model {model_name} lỗi: {model_err}, thử model tiếp theo...")
                    continue

            return None

        except Exception as e:
            logger.error(f"Lỗi khi phân tích hình ảnh qua VisionService: {e}")
            return None
