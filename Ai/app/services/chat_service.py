import os
from google import genai
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.schemas.chat.chat import RagRequest, RagResponse, SourceChunk
from app.utils.retry import retry

SYSTEM_PROMPT = """Bạn là trợ lý AI hỗ trợ tra cứu tài liệu doanh nghiệp.
Chỉ trả lời dựa trên ngữ cảnh được cung cấp bên dưới.
Nếu ngữ cảnh không đủ thông tin để trả lời, hãy nói rõ là không tìm thấy thông tin liên quan trong tài liệu.
Không tự suy diễn hoặc bịa số liệu, tên riêng, ngày tháng không có trong ngữ cảnh."""

DEFAULT_TOP_K = 5


class ChatService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường GEMINI_API_KEY")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-3.1-flash-lite"

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
            )
            for hit in hits
        ]

        context = "\n\n---\n\n".join(
            f"[Nguồn {i+1}] {s.content}" for i, s in enumerate(sources)
        )

        prompt = f"{SYSTEM_PROMPT}\n\nNgữ cảnh:\n{context}\n\nCâu hỏi: {request.question}"

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