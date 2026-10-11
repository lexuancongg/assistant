import os
import re
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
load_dotenv()
from google import genai
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.reranker_service import RerankerService
from app.services.agent_service import EnterpriseAgentEngine
from app.schemas.chat.chat import RagRequest, RagResponse, SourceChunk, AgentTraceStep
from app.schemas.chat.search import SearchRequest, SearchResponse, SearchSourceChunk
from app.utils.retry import retry

SYSTEM_PROMPT = """Bạn là Trợ lý AI Doanh nghiệp (Enterprise AI Assistant) thông minh, chuyên nghiệp, chính xác và súc tích.
Nhiệm vụ của bạn là hỗ trợ người dùng tra cứu, phân tích tài liệu và giải đáp các thắc mắc nhanh chóng, gãy gọn và ĐÚNG TRỌNG TÂM NHẤT.

### QUY TẮC PHẢN HỒI (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):

1. **TRỰC DIỆN, NGẮN GỌN & TUYỆT ĐỐI KHÔNG DÀI DÒNG (ZERO FLUFF)**:
   - **Đi thẳng vào câu trả lời ngay từ dòng đầu tiên**.
   - **CẤM mọi lời chào hỏi, xưng hô hoặc mở bài rườm rà** (KHÔNG viết: "Chào bạn", "Với tư cách là...", "Tôi đã rà soát...", "Dựa trên ngữ cảnh trích xuất...", "Dưới đây là câu trả lời...").
   - **CẤM mọi câu chào kết, xã giao cuối thư** (KHÔNG viết: "Hy vọng câu trả lời giúp ích...", "Nếu bạn cần thêm thông tin...", "Hãy cho tôi biết nếu có thắc mắc...").
   - Không lặp lại nguyên văn câu hỏi của người dùng.

2. **ĐÚNG Ý ĐỊNH TRUY VẤN (INTENT-FIRST)**:
   - **Khi người dùng hỏi về danh sách tài liệu / file (ví dụ: "có những file nào...", "danh sách file...", "file nào nói về...", "file nào là CV...")**:
     + Mục tiêu duy nhất: người dùng muốn biết **tên các tài liệu phù hợp**.
     + **CHỈ LIỆT KÊ TÊN CÁC TÀI LIỆU** phù hợp theo định dạng gạch đầu dòng. Mỗi tài liệu kèm tối đa 1 dòng giải thích ngắn gọn lý do liên quan. Phân biệt rõ giữa CV/hồ sơ ứng tuyển cá nhân (thường có tên ứng viên, vị trí Intern, Developer, thông tin ứng viên) với tài liệu chương trình đào tạo/học phần (như giáo trình, chuẩn đầu ra).
     + **TUYỆT ĐỐI KHÔNG tự ý tóm tắt chi tiết toàn bộ nội dung tài liệu** khi người dùng KHÔNG yêu cầu tóm tắt/phân tích nội dung.
   - **Khi người dùng hỏi tra cứu số liệu, dữ kiện, điều khoản cụ thể (Fact Lookup)**:
     + Trả lời trực diện kết quả / con số / điều khoản ngay ở câu đầu tiên.
     + In đậm các thông tin quan trọng (`**số liệu**`, `**thời hạn**`, `**điều khoản**`, `**tên riêng**`).
   - **Khi người dùng yêu cầu tóm tắt / giải thích quy trình**:
     + Trình bày súc tích bằng danh sách gạch đầu dòng (`-`) ngắn gọn, cô đọng (tối đa 3 - 5 ý chính), loại bỏ các chi tiết thừa thãi.

3. **TRUNG THỰC VÀ GIỚI HẠN THÔNG TIN**:
   - Chỉ trả lời dựa trên thông tin thực tế trong [DANH SÁCH TÀI LIỆU HIỆN CÓ] hoặc [NGỮ CẢNH TRÍCH XUẤT].
   - Không tự suy diễn hay bịa đặt thông tin.
   - Nếu ngữ cảnh không có thông tin, chỉ trả lời 1 câu duy nhất: *"Không tìm thấy thông tin phù hợp trong các tài liệu hiện có."*

4. **ĐỊNH DẠNG**:
   - Sử dụng Markdown chuẩn, gạch đầu dòng (`-`), in đậm từ khóa cốt lõi giúp người dùng nắm bắt thông tin ngay tức thì."""

DEFAULT_TOP_K = 5


def call_deepseek(prompt: str, system_prompt: str) -> Optional[str]:
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        return None
    try:
        import json
        import urllib.request
        payload = json.dumps({
            "model": os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.deepseek.com/v1/chat/completions",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception:
        return None


class ChatService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()
        self.reranker_service = RerankerService(top_n=5)
        self.agent_engine = EnterpriseAgentEngine()

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường GEMINI_API_KEY")

        self.client = genai.Client(api_key=api_key)
        self.model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")

    def ask(self, request: RagRequest) -> RagResponse:
        # =========================================================================
        # 1. NẾU CHỌN CHẾ ĐỘ AGENTIC MULTI-AGENT WORKFLOW
        # =========================================================================
        if getattr(request, "mode", None) == "AGENTIC_WORKFLOW":
            workflow_res = self.agent_engine.run_workflow(
                question=request.question,
                document_id=request.documentId,
                allowed_document_ids=request.allowedDocumentIds,
                available_files=request.availableFiles,
                history=request.history,
                model_provider=request.modelProvider
            )
            return RagResponse(
                answer=workflow_res.answer,
                sources=[
                    SourceChunk(
                        chunkId=s.get("chunkId", ""),
                        content=s.get("content", ""),
                        score=float(s.get("score", 0.0)),
                        documentId=s.get("documentId"),
                        chunkIndex=s.get("chunkIndex")
                    )
                    for s in workflow_res.sources
                ],
                mode="AGENTIC_WORKFLOW",
                intent=workflow_res.intent,
                groundednessScore=workflow_res.groundednessScore,
                reasoningTrace=[
                    AgentTraceStep(
                        agentName=t.agentName,
                        action=t.action,
                        outputSummary=t.outputSummary,
                        status=t.status
                    )
                    for t in workflow_res.reasoningTrace
                ]
            )

        # =========================================================================
        # 2. CHẾ ĐỘ STANDARD ADVANCED RAG (VECTORD DB + HYBRID RERANKER + LLM)
        # =========================================================================
        # 0. Phân tích danh mục file và ánh xạ ID tài liệu
        doc_id_to_file: Dict[str, str] = {}
        clean_files_list: List[str] = []
        if request.availableFiles:
            for f in request.availableFiles:
                match = re.search(r'^(.*?)\s*\[DocID:\s*(\d+)\]\s*(.*)$', f)
                if match:
                    fname = match.group(1).strip()
                    num_id = match.group(2).strip()
                    extra = match.group(3).strip()
                    doc_id_to_file[num_id] = fname
                    clean_files_list.append(f"{fname} {extra}".strip())
                else:
                    clean_files_list.append(f)

        query_vector = self.embedding_service.embed([request.question])[0]

        # Lấy ứng viên rộng (top 25) từ Qdrant kèm bộ lọc phân quyền RBAC
        raw_hits = self.qdrant_service.search(
            query_vector=query_vector,
            document_id=request.documentId,
            top_k=25,
            allowed_document_ids=request.allowedDocumentIds
        )

        # Áp dụng Hybrid Cross-Scoring Reranker (Dense + Lexical BM25 + Exact Match)
        reranked_hits = self.reranker_service.rerank(query=request.question, candidates=raw_hits)
        top_hits = reranked_hits[:DEFAULT_TOP_K]

        sources = [
            SourceChunk(
                chunkId=hit["id"],
                content=hit["text"],
                score=float(hit.get("score", hit.get("rerank_score", 0.0))),
                documentId=hit.get("document_id"),
                chunkIndex=hit.get("chunk_index"),
            )
            for hit in top_hits
        ]

        context_parts = []
        for i, s in enumerate(sources):
            s_doc_id = str(s.documentId) if s.documentId is not None else ""
            doc_name = doc_id_to_file.get(s_doc_id, "")
            doc_label = f"Tài liệu: {doc_name} | " if doc_name else ""
            context_parts.append(f"[Trích đoạn {i+1} - {doc_label}Đoạn {s.chunkIndex or (i+1)}]\n{s.content}")
        context = "\n\n---\n\n".join(context_parts)

        files_text = ""
        if clean_files_list:
            file_items = "\n".join(f"- {f}" for f in clean_files_list)
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

        user_content = f"""{files_text}{history_text}### NGỮ CẢNH TRÍCH XUẤT TỪ NỘI DUNG TÀI LIỆU (HYBRID RAG):
{context if context else "(Không có đoạn trích nào từ tài liệu)"}

---
### CÂU HỎI CỦA NGƯỜI DÙNG:
{request.question}

---
### YÊU CẦU BẮT BUỘC KHI TRẢ LỜI:
- Trả lời trực diện, đúng trọng tâm, ngắn gọn và súc tích.
- TUYỆT ĐỐI KHÔNG chào hỏi, KHÔNG giới thiệu chức danh/bản thân, KHÔNG kết bài xã giao.
- Nếu câu hỏi chỉ hỏi danh sách file hoặc có những file nào, CHỈ nêu danh sách tên file phù hợp, TUYỆT ĐỐI KHÔNG tự ý tóm tắt nội dung tài liệu."""

        answer_text = None
        if getattr(request, "modelProvider", "gemini") == "deepseek":
            answer_text = call_deepseek(user_content, SYSTEM_PROMPT)

        prompt_tokens = None
        completion_tokens = None
        total_tokens = None

        if not answer_text:
            response = retry(
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=user_content,
                    config={
                        "system_instruction": SYSTEM_PROMPT,
                        "temperature": 0.2,
                    },
                )
            )
            answer_text = response.text
            # Extract real token counts from Gemini usage_metadata
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                usage = response.usage_metadata
                prompt_tokens = getattr(usage, "prompt_token_count", None)
                completion_tokens = getattr(usage, "candidates_token_count", None)
                if prompt_tokens is not None and completion_tokens is not None:
                    total_tokens = prompt_tokens + completion_tokens

        return RagResponse(
            answer=answer_text,
            sources=sources,
            mode="STANDARD_RAG",
            promptTokens=prompt_tokens,
            completionTokens=completion_tokens,
            totalTokens=total_tokens,
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
