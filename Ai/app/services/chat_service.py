import os
from google import genai
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.schemas.chat.chat import RagRequest, RagResponse, SourceChunk
from app.schemas.chat.search import SearchRequest, SearchResponse, SearchSourceChunk
from app.utils.retry import retry

SYSTEM_PROMPT = """Bạn là Trợ lý AI Doanh nghiệp (Enterprise AI Assistant) thông minh, chuyên nghiệp và tận tâm.
Nhiệm vụ của bạn là hỗ trợ người dùng tra cứu, phân tích tài liệu và giải đáp các thắc mắc liên quan đến hoạt động của doanh nghiệp.

### NGUYÊN TẮC TRẢ LỜI:
1. **Độ chính xác và trung thực**:
   - Chỉ trả lời dựa trên **Ngữ cảnh trích xuất từ tài liệu** hoặc **Danh sách tài liệu hiện có trong hệ thống** được cung cấp bên dưới.
   - Tuyệt đối không tự suy diễn, bịa đặt thông tin, ngày tháng, điều khoản, số liệu hay tên riêng nếu không có trong dữ liệu.
   - Nếu ngữ cảnh không có thông tin và câu hỏi không liên quan đến danh sách tài liệu, hãy lịch sự thông báo rằng không tìm thấy thông tin phù hợp trong các tài liệu hiện có của hệ thống.

2. **Khi người dùng hỏi về danh sách / số lượng / tên tài liệu**:
   - Hãy tra cứu trực tiếp từ mục `[DANH SÁCH TÀI LIỆU HIỆN CÓ TRONG HỆ THỐNG]`.
   - Trình bày danh sách rõ ràng, đầy đủ kèm định dạng (ví dụ PDF, DOCX...) theo dạng danh sách đánh số hoặc gạch đầu dòng.

3. **Định dạng câu trả lời (Formatting)**:
   - Sử dụng Markdown chuẩn, bố cục rõ ràng, chuyên nghiệp:
     + Dùng tiêu đề mục (ví dụ `###`, `####`) khi câu trả lời có nhiều phần.
     + In đậm (`**từ khóa quan trọng**`, `**số liệu**`, `**điều khoản**`) để người đọc dễ nắm bắt ý chính.
     + Sử dụng danh sách gạch đầu dòng (`-`) hoặc đánh số (`1.`, `2.`) cho các ý liệt kê, quy trình.
     + Sử dụng bảng Markdown (`| Cột 1 | Cột 2 |`) khi so sánh dữ liệu hoặc trình bày số liệu.
   - Giọng điệu lịch sự, mạch lạc, dễ hiểu bằng tiếng Việt chuẩn mực."""

DEFAULT_TOP_K = 5


class ChatService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường GEMINI_API_KEY")

        self.client = genai.Client(api_key=api_key)
        self.model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")

    def ask(self, request: RagRequest) -> RagResponse:
        query_vector = self.embedding_service.embed([request.question])[0]

        hits = self.qdrant_service.search(
            query_vector=query_vector,
            document_id=request.documentId,
            top_k=DEFAULT_TOP_K,
        )

        sources = [
            SourceChunk(
                chunkId=hit["id"],
                content=hit["text"],
                score=hit["score"],
                documentId=hit.get("document_id"),
                chunkIndex=hit.get("chunk_index"),
            )
            for hit in hits
        ]

        context = "\n\n---\n\n".join(
            f"[Trích đoạn {i+1}] {s.content}" for i, s in enumerate(sources)
        )

        persona_text = ""
        if request.persona:
            persona_text = f"**Vai trò chuyên môn của trợ lý:** {request.persona}\n\n"

        files_text = ""
        if request.availableFiles and len(request.availableFiles) > 0:
            file_items = "\n".join(f"- {f}" for f in request.availableFiles)
            files_text = f"### DANH SÁCH TÀI LIỆU HIỆN CÓ TRONG HỆ THỐNG:\n{file_items}\n\n"
        else:
            files_text = "### DANH SÁCH TÀI LIỆU HIỆN CÓ TRONG HỆ THỐNG:\n(Hiện tại chưa có tài liệu nào hoặc chưa tải lên)\n\n"

        history_text = ""
        if getattr(request, "history", None) and request.history:
            history_lines = []
            for message in request.history:
                role = message.role.capitalize() if message.role else "User"
                history_lines.append(f"**{role}:** {message.content}")
            history_text = "### LỊCH SỬ CUỘC TRÒ CHUYỆN GẦN ĐÂY:\n" + "\n".join(history_lines) + "\n\n"

        prompt = f"""{SYSTEM_PROMPT}

{persona_text}{files_text}{history_text}### NGỮ CẢNH TRÍCH XUẤT TỪ NỘI DUNG TÀI LIỆU (VECTOR SEARCH):
{context}

---
### CÂU HỎI CỦA NGƯỜI DÙNG:
{request.question}

### CÂU TRẢ LỜI CỦA BẠN (Trình bày Markdown chuyên nghiệp, rõ ràng, gãy gọn):"""

        response = retry(
            lambda: self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
        )

        return RagResponse(
            answer=response.text,
            sources=sources,
        )

    def search(self, request: SearchRequest) -> SearchResponse:
        query_vector = self.embedding_service.embed([request.query])[0]

        hits = self.qdrant_service.search(
            query_vector=query_vector,
            document_id=request.documentId,
            top_k=request.topK or DEFAULT_TOP_K,
        )

        sources = [
            SearchSourceChunk(
                chunkId=hit["id"],
                content=hit["text"],
                score=hit["score"],
                documentId=hit.get("document_id"),
                chunkIndex=hit.get("chunk_index"),
            )
            for hit in hits
        ]

        return SearchResponse(sources=sources)
