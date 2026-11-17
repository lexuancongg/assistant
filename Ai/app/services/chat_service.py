import os
import re
import logging
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.reranker_service import RerankerService
from app.services.agent_service import EnterpriseAgentEngine
from app.schemas.chat.chat import RagRequest, RagResponse, SourceChunk, AgentTraceStep, OverviewRequest, OverviewResponse
from app.schemas.chat.search import SearchRequest, SearchResponse, SearchSourceChunk
from app.utils.retry import retry

logger = logging.getLogger(__name__)

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
     + **CHỈ LIỆT KÊ TÊN CÁC TÀI LIỆU** phù hợp theo định dạng gạch đầu dòng. Mỗi tài liệu kèm tối đa 1 dòng giải thích ngắn gọn lý do liên quan. Phân biệt rõ giữa CV/hồ sơ ứng tuyển cá nhân với tài liệu đào tạo/quy trình.
     + **TUYỆT ĐỐI KHÔNG tự ý tóm tắt chi tiết toàn bộ nội dung tài liệu** khi người dùng KHÔNG yêu cầu tóm tắt/phân tích nội dung.
   - **Khi người dùng hỏi tra cứu số liệu, dữ kiện, điều khoản cụ thể (Fact Lookup)**:
     + Trả lời trực diện kết quả / con số / điều khoản ngay ở câu đầu tiên.
     + In đậm các thông tin quan trọng (`**số liệu**`, `**thời hạn**`, `**điều khoản**`, `**tên riêng**`).
   - **Khi người dùng hỏi về quy trình, sơ đồ, các bước thực hiện (Diagram / Flowchart / SOP)**:
     + Bắt buộc liệt kê rõ ràng theo đúng trình tự tuần tự: **Bước 1 -> Bước 2 -> Bước 3...**
     + Nêu rõ **người/đối tượng chịu trách nhiệm** ở mỗi bước và **các điều kiện rẽ nhánh** (Nếu Đạt/Không đạt, Nếu Có/Không thì chuyển sang bước nào).
     + Giữ nguyên vẹn tính logic của sơ đồ, không đảo lộn hoặc tự ý suy diễn các bước.
   - **Khi người dùng hỏi về bảng biểu, số liệu so sánh**:
     + Trình bày rõ ràng hoặc dưới dạng bảng Markdown, giữ nguyên số liệu chính xác trong tài liệu, không làm tròn sai lệch.

3. **TRUNG THỰC VÀ GIỚI HẠN THÔNG TIN**:
   - Chỉ trả lời dựa trên thông tin thực tế trong [DANH SÁCH TÀI LIỆU HIỆN CÓ] hoặc [NGỮ CẢNH TRÍCH XUẤT].
   - Không tự suy diễn hay bịa đặt thông tin.
   - Nếu ngữ cảnh không có thông tin, chỉ trả lời 1 câu duy nhất: *"Không tìm thấy thông tin phù hợp trong các tài liệu hiện có."*

4. **ĐỊNH DẠNG**:
   - Sử dụng Markdown chuẩn, gạch đầu dòng (`-`), in đậm từ khóa cốt lõi giúp người dùng nắm bắt thông tin ngay tức thì."""

DEFAULT_TOP_K = 5


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
        # 1. CHẾ ĐỘ AGENTIC MULTI-AGENT WORKFLOW (MẶC ĐỊNH)
        # =========================================================================
        req_mode = getattr(request, "mode", None) or "AGENTIC_WORKFLOW"
        if "STANDARD" not in req_mode.upper():
            workflow_res = self.agent_engine.run_workflow(
                question=request.question,
                document_id=request.documentId,
                allowed_document_ids=request.allowedDocumentIds,
                department_id=getattr(request, "departmentId", None),
                company_id=getattr(request, "companyId", None),
                history=request.history,
                model_provider=request.modelProvider,
                folder_name=getattr(request, "folderName", None),
                sub_folder_names=getattr(request, "subFolderNames", None),
                available_files=getattr(request, "availableFiles", None),
                context_text=getattr(request, "contextText", None),
            )
            return RagResponse(
                answer=workflow_res.answer,
                sources=[
                    SourceChunk(
                        chunkId=s.get("chunkId", ""),
                        content=s.get("content", ""),
                        score=float(s.get("score", 0.0)),
                        documentId=s.get("documentId"),
                        chunkIndex=s.get("chunkIndex"),
                        imagePath=s.get("imagePath"),
                        isVisual=bool(s.get("imagePath"))
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
        query_vector = self.embedding_service.embed([request.question], is_query=True)[0]

        # Lấy ứng viên rộng (top 25) từ Qdrant kèm bộ lọc phân quyền RBAC
        raw_hits = self.qdrant_service.search(
            query_vector=query_vector,
            document_id=request.documentId,
            top_k=25,
            allowed_document_ids=request.allowedDocumentIds,
            department_id=getattr(request, "departmentId", None),
            company_id=getattr(request, "companyId", None)
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
                imagePath=hit.get("image_path"),
                isVisual=bool(hit.get("image_path"))
            )
            for hit in top_hits
        ]

        context_parts = []
        for i, s in enumerate(sources):
            s_doc_id = str(s.documentId) if s.documentId is not None else ""
            doc_label = f"Tài liệu #{s_doc_id} | " if s_doc_id else ""
            context_parts.append(f"[Trích đoạn {i+1} - {doc_label}Đoạn {s.chunkIndex or (i+1)}]\n{s.content}")
        context = "\n\n---\n\n".join(context_parts)

        history_text = ""
        if getattr(request, "history", None) and request.history:
            history_lines = []
            for message in request.history:
                role = message.role.capitalize() if message.role else "User"
                history_lines.append(f"**{role}:** {message.content}")
            history_text = "### LỊCH SỬ CUỘC TRÒ CHUYỆN GẦN ĐÂY:\n" + "\n".join(history_lines) + "\n\n"

        metadata_lines = []
        folder_name = getattr(request, "folderName", None)
        sub_folder_names = getattr(request, "subFolderNames", None)
        available_files = getattr(request, "availableFiles", None)
        if folder_name:
            metadata_lines.append(f"- Phạm vi / Thư mục hiện tại: **{folder_name}**")
        if sub_folder_names and len(sub_folder_names) > 0:
            metadata_lines.append(f"- Thư mục con trực thuộc ({len(sub_folder_names)} thư mục): {', '.join(sub_folder_names)}")
        if available_files and len(available_files) > 0:
            metadata_lines.append(f"- Tổng số lượng tài liệu/tệp trong phạm vi: **{len(available_files)} tệp**")
            metadata_lines.append("- Danh sách tất cả các tệp hiện có trong phạm vi truy vấn:")
            for idx, fn in enumerate(available_files, 1):
                metadata_lines.append(f"  {idx}. {fn}")
        metadata_str = "\n".join(metadata_lines)
        metadata_sec = f"### CẤU TRÚC THƯ MỤC & DANH MỤC TÀI LIỆU HIỆN CÓ CỦA HỆ THỐNG:\n{metadata_str}\n\n" if metadata_str else ""

        user_content = f"""{history_text}{metadata_sec}### NGỮ CẢNH TRÍCH XUẤT TỪ NỘI DUNG TÀI LIỆU (HYBRID RAG):
{context if context else "(Không có đoạn trích nào từ tài liệu)"}

---
### CÂU HỎI CỦA NGƯỜI DÙNG:
{request.question}

---
### YÊU CẦU BẮT BUỘC KHI TRẢ LỜI:
- Trả lời trực diện, đúng trọng tâm, ngắn gọn và súc tích.
- TUYỆT ĐỐI KHÔNG chào hỏi, KHÔNG giới thiệu chức danh/bản thân, KHÔNG kết bài xã giao.
- Nếu câu hỏi chỉ hỏi danh sách file hoặc có những file nào, CHỈ nêu danh sách tên file phù hợp, TUYỆT ĐỐI KHÔNG tự ý tóm tắt nội dung tài liệu.
- Nếu câu hỏi liên quan đến sơ đồ / quy trình, liệt kê đầy đủ trình tự các bước tuần tự và các điều kiện rẽ nhánh theo đúng dữ liệu trích xuất."""

        # Chuẩn bị contents gửi sang Gemini (Hỗ trợ Multimodal Visual Grounding)
        contents_payload: List[Any] = [user_content]
        attached_images = 0
        for hit in top_hits:
            img_path = hit.get("image_path")
            if img_path and os.path.exists(img_path) and attached_images < 2:
                try:
                    with open(img_path, "rb") as f:
                        img_bytes = f.read()
                    ext = os.path.splitext(img_path)[1].lstrip(".").lower()
                    mime = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
                    contents_payload.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))
                    attached_images += 1
                except Exception as img_err:
                    logger.debug(f"Không thể nạp ảnh Visual Grounding {img_path}: {img_err}")

        if attached_images > 0:
            user_content += "\n\n[LƯU Ý THỊ GIÁC]: Đã đính kèm ảnh gốc của sơ đồ/trang tài liệu. Hãy trực tiếp quan sát ảnh để xác nhận mọi chi tiết và trả lời câu hỏi một cách chuẩn xác tuyệt đối!"
            contents_payload[0] = user_content

        prompt_tokens = None
        completion_tokens = None
        total_tokens = None

        response = retry(
            lambda: self.client.models.generate_content(
                model=self.model,
                contents=contents_payload,
                config={
                    "system_instruction": SYSTEM_PROMPT,
                    "temperature": 0.2,
                },
            )
        )
        answer_text = response.text
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
        query_vector = self.embedding_service.embed([request.query], is_query=True)[0]

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


    def get_overview(self, request: OverviewRequest) -> OverviewResponse:
        source_name = request.sourceName or "Tài liệu"

        context_text = ""
        if request.contextText and request.contextText.strip():
            context_text = request.contextText.strip()[:8000]

        if not context_text:
            candidate_chunks = []
            try:
                summary_query_vec = self.embedding_service.embed(["Tóm tắt tổng quan nội dung chính và các chủ đề cốt lõi của tài liệu"], is_query=True)[0]
                target_doc_id = request.documentId if request.documentId is not None else request.fileId
                candidate_chunks = self.qdrant_service.search(
                    query_vector=summary_query_vec,
                    document_id=target_doc_id,
                    top_k=15,
                    allowed_document_ids=request.allowedDocumentIds,
                    department_id=None,
                    company_id=None,
                )
            except Exception as q_err:
                logger.warning(f"Failed to query Qdrant for overview: {q_err}")

            if candidate_chunks:
                seen_docs = {}
                diverse_chunks = []
                for c in candidate_chunks:
                    doc_id = str(c.get("document_id", "0"))
                    seen_docs[doc_id] = seen_docs.get(doc_id, 0) + 1
                    if seen_docs[doc_id] <= 2:
                        diverse_chunks.append(c)
                context_text = "\n\n".join([f"- Đoạn {i+1} (Tài liệu #{c.get('document_id', '')}): {c['text'][:600]}" for i, c in enumerate(diverse_chunks[:8])])

        if not context_text:
            return OverviewResponse(
                summary=f"Nguồn được chọn bao gồm các tài liệu thuộc mục \"{source_name}\". Hệ thống đã kết nối và sẵn sàng hỗ trợ bạn tra cứu, tóm tắt chi tiết hoặc trích xuất số liệu quan trọng.",
                suggestedQuestions=[
                    f"Tóm tắt các điểm trọng tâm nhất trong {source_name}.",
                    f"Liệt kê các số liệu hoặc quyết định quan trọng được ghi nhận.",
                    f"Đưa ra các câu hỏi thường gặp liên quan đến {source_name}."
                ]
            )

        system_instruction = (
            "Bạn là Trợ lý AI Thông minh trong hệ thống Enterprise Google Drive AI Assistant.\n"
            "Nhiệm vụ: Phân tích các đoạn trích nội dung thực tế của tài liệu/thư mục và tạo ra một bản tóm tắt tổng quan súc tích cùng 3 câu hỏi gợi ý thông minh bám sát nội dung thực tế.\n\n"
            "QUY TẮC BẮT BUỘC:\n"
            "1. 'summary': Viết một đoạn tóm tắt tổng quan 2 đến 4 câu mô tả CHÍNH XÁC NỘI DUNG VĂN BẢN THỰC TẾ của tài liệu/thư mục. "
            "BẮT BUỘC DỰA TRÊN NỘI DUNG VĂN BẢN ĐƯỢC TRÍCH XUẤT, TUYỆT ĐỐI KHÔNG ĐƯỢC ĐOÁN DỰA TRÊN TÊN FILE (vì tên file có thể đặt tùy ý). "
            "Nếu nguồn là THƯ MỤC gồm nhiều tài liệu: Hãy tổng hợp bao quát các chủ đề/nghiệp vụ chính từ các đoạn trích của các tài liệu khác nhau trong thư mục (bao gồm các nội dung về quy trình, kỹ thuật, dữ liệu, biểu mẫu...), tuyệt đối không được chỉ tóm tắt thiên lệch vào duy nhất một tài liệu đơn lẻ. "
            "Bắt đầu trực tiếp ngay từ dòng đầu tiên, tuyệt đối không dùng lời mở đầu sáo rỗng như 'Tài liệu này nói về...', 'Dưới đây là...', 'Thư mục này gồm...'.\n"
            "2. 'suggestedQuestions': Tạo đúng 3 câu hỏi gợi ý thông minh, sâu sắc, bám sát trực tiếp vào các tên riêng, công nghệ, số liệu, quy trình hoặc quyết định có trong nội dung thực tế.\n\n"
            "BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON:\n"
            "{\n"
            '  "summary": "<nội dung tóm tắt>",\n'
            '  "suggestedQuestions": [\n'
            '    "<câu hỏi gợi ý 1>",\n'
            '    "<câu hỏi gợi ý 2>",\n'
            '    "<câu hỏi gợi ý 3>"\n'
            '  ]\n'
            "}"
        )

        user_content = f"Nguồn tài liệu: {source_name}\n\n### NỘI DUNG TRÍCH XUẤT:\n{context_text}"

        try:
            import json
            response = retry(
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=user_content,
                    config={
                        "system_instruction": system_instruction,
                        "response_mime_type": "application/json",
                        "temperature": 0.2,
                    },
                )
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            if raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
            data = json.loads(raw_text.strip())

            summary = data.get("summary", "").strip()
            suggested = data.get("suggestedQuestions", [])
            if not summary:
                summary = f"Các tài liệu thuộc mục \"{source_name}\" đã được phân tích ngữ nghĩa, sẵn sàng hỗ trợ bạn tra cứu và đối soát dữ liệu."
            if not isinstance(suggested, list) or len(suggested) < 3:
                suggested = [
                    f"Tóm tắt các điểm trọng tâm nhất trong {source_name}.",
                    f"Liệt kê các số liệu hoặc quyết định quan trọng được ghi nhận.",
                    f"Đưa ra các câu hỏi thường gặp liên quan đến {source_name}."
                ]

            return OverviewResponse(
                summary=summary,
                suggestedQuestions=suggested[:3]
            )
        except Exception as e:
            logger.error(f"Error generating AI overview: {e}")
            return OverviewResponse(
                summary=f"Các tài liệu thuộc mục \"{source_name}\" đã được phân tích ngữ nghĩa, sẵn sàng hỗ trợ bạn tra cứu và đối soát dữ liệu.",
                suggestedQuestions=[
                    f"Tóm tắt những điểm trọng tâm nhất trong {source_name}.",
                    f"Liệt kê các số liệu hoặc quyết định quan trọng được ghi nhận.",
                    f"Đưa ra các câu hỏi thường gặp liên quan đến tài liệu này."
                ]
            )
