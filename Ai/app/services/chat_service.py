import os
from google import genai
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.schemas.chat.chat import RagRequest, RagResponse, SourceChunk
from app.schemas.chat.search import SearchRequest, SearchResponse, SearchSourceChunk
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
            f"[Nguồn {i+1}] {s.content}" for i, s in enumerate(sources)
        )

        persona_text = ""
        if request.persona:
            persona_text = f"Vai trò trợ lý: {request.persona}.\n\n"

        history_text = ""
        if getattr(request, "history", None):
            history_lines = []
            for message in request.history:
                role = message.role.capitalize() if message.role else "User"
                history_lines.append(f"{role}: {message.content}")
            history_text = "Lịch sử cuộc trò chuyện:\n" + "\n".join(history_lines) + "\n\n"

        prompt = f"{SYSTEM_PROMPT}\n\n{persona_text}{history_text}Ngữ cảnh:\n{context}\n\nCâu hỏi: {request.question}"

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
