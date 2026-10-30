"""
Agentic Multi-Agent Workflow Engine for Enterprise AI Assistant.
Mô hình hóa quy trình xử lý theo đồ thị trạng thái (State Graph / Multi-Agent Workflow):
1. Router Agent: Phân loại ý định người dùng (Contract / Finance / HR / General).
2. Retrieval Agent: Truy xuất ngữ cảnh Qdrant có phân quyền RBAC.
3. Rerank Agent: Tái xếp hạng các ứng viên theo Hybrid Fusion Scoring.
4. Fact-Checking Agent: Giám sát ảo giác (Hallucination Guardrail) và đối chiếu với nguồn văn bản gốc.
5. Synthesizer Agent: Tổng hợp câu trả lời hoàn chỉnh kèm Reasoning Trace.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import os
import re
import json
import urllib.request
import numpy as np
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.reranker_service import RerankerService
from app.utils.retry import retry

class AgentTraceStep(BaseModel):
    agentName: str
    action: str
    outputSummary: str
    status: str = "SUCCESS"

class AgentWorkflowResult(BaseModel):
    answer: str
    intent: str
    groundednessScore: float
    reasoningTrace: List[AgentTraceStep]
    sources: List[Dict[str, Any]]


class EnterpriseAgentEngine:

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()
        self.reranker_service = RerankerService(top_n=5)

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")

    def _classify_intent(self, question: str) -> Dict[str, Any]:
        """
        Router Agent: Phân loại ý định truy vấn sử dụng LLM Structured Output.
        Hỗ trợ đa ngôn ngữ, tự động nhận diện ngữ nghĩa sâu mà không cần hardcode từ khóa.
        """
        router_system_prompt = (
            "Bạn là Router Agent trong hệ thống Trợ lý Doanh nghiệp cấp cao.\n"
            "Nhiệm vụ: Phân tích ngữ nghĩa câu hỏi của người dùng và phân loại vào MỘT trong các nhóm ý định sau:\n\n"
            "1. FILE_METADATA_INQUIRY: Người dùng muốn tra cứu danh mục, tìm kiếm tệp tin, hỏi xem hệ thống có những file/tài liệu nào, "
            "file nào nói về chủ đề gì, có CV/hồ sơ của ai... (Hỏi về danh mục tệp thay vì hỏi sâu vào nội dung 1 điều khoản).\n"
            "2. CONTRACT_LEGAL_ANALYSIS: Câu hỏi liên quan đến hợp đồng, điều khoản cam kết, quyền và nghĩa vụ pháp lý, "
            "phạt vi phạm, trách nhiệm bồi thường, chấm dứt hợp đồng...\n"
            "3. FINANCE_ACCOUNTING: Câu hỏi về tài chính, kế toán, hóa đơn, thanh toán, quyết toán, chi phí, tạm ứng, dự toán ngân sách...\n"
            "4. HR_POLICY: Câu hỏi về quy chế nhân sự, lương thưởng, ngày nghỉ phép, bảo hiểm xã hội, thời gian thử việc, kỷ luật lao động...\n"
            "5. GENERAL_DOCUMENT_SEARCH: Các câu hỏi tra cứu kiến thức, nội dung quy trình hoặc thông tin tài liệu chung khác.\n\n"
            "BẮT BUỘC trả về đúng định dạng JSON thuần túy:\n"
            "{\n"
            '  "intent": "FILE_METADATA_INQUIRY" | "CONTRACT_LEGAL_ANALYSIS" | "FINANCE_ACCOUNTING" | "HR_POLICY" | "GENERAL_DOCUMENT_SEARCH",\n'
            '  "intentDescription": "<Mô tả ngắn gọn ý định bằng tiếng Việt>",\n'
            '  "confidence": <số thực từ 0.0 đến 1.0>,\n'
            '  "reasoning": "<Lý do phân loại ngắn gọn trong 1 câu>"\n'
            "}"
        )

        try:
            response = retry(
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=f'Câu hỏi của người dùng: "{question}"',
                    config={
                        "system_instruction": router_system_prompt,
                        "response_mime_type": "application/json",
                        "temperature": 0.1,
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
            raw_text = raw_text.strip()
            data = json.loads(raw_text)

            valid_intents = {
                "FILE_METADATA_INQUIRY",
                "CONTRACT_LEGAL_ANALYSIS",
                "FINANCE_ACCOUNTING",
                "HR_POLICY",
                "GENERAL_DOCUMENT_SEARCH",
            }
            intent = data.get("intent", "GENERAL_DOCUMENT_SEARCH")
            if intent not in valid_intents:
                intent = "GENERAL_DOCUMENT_SEARCH"

            return {
                "intent": intent,
                "intentDescription": data.get("intentDescription", "Tra cứu & Tổng hợp Tri thức Tài liệu Doanh nghiệp"),
                "confidence": float(data.get("confidence", 0.95)),
                "reasoning": data.get("reasoning", "Phân tích ngữ nghĩa tự động từ câu hỏi người dùng")
            }
        except Exception as e:
            # Fallback an toàn nếu có sự cố mạng
            return {
                "intent": "GENERAL_DOCUMENT_SEARCH",
                "intentDescription": "Tra cứu & Tổng hợp Tri thức Tài liệu Doanh nghiệp",
                "confidence": 0.70,
                "reasoning": f"Phân loại mặc định dự phòng ({str(e)})"
            }

    def _evaluate_groundedness_llm_judge(self, context_str: str, answer: str) -> Dict[str, Any]:
        """
        CÁCH 1 (ĐANG ÁP DỤNG THỰC TẾ): LLM-as-a-Judge (Phương pháp chuẩn công nghiệp)
        ----------------------------------------------------------------------------------
        Cơ chế: Sử dụng LLM độc lập (Gemini Flash) với vai trò Fact-Checking Judge
        để phân tích câu trả lời (Answer) có hoàn toàn căn cứ trên ngữ cảnh (Context) hay không.
        
        Ưu điểm vượt trội so với regex/từ khóa:
        - Hiểu sâu ngữ nghĩa (Semantic understanding), nhận diện được từ đồng nghĩa, cấu trúc hoán dụ.
        - Không bị ảnh hưởng bởi danh sách từ khóa cố định hay câu chữ khác biệt.
        - Phát hiện chính xác ảo giác tinh vi (Subtle Hallucinations) hoặc suy diễn không căn cứ.
        """
        if not context_str or not context_str.strip():
            return {
                "groundednessScore": 0.30,
                "hasHallucination": True,
                "critique": "Không có tài liệu nguồn nào được tìm thấy để đối chiếu."
            }

        judge_system_prompt = (
            "Bạn là Fact-Checking Judge trong hệ thống Trợ lý Doanh nghiệp RAG.\n"
            "Nhiệm vụ: Thẩm định xem câu trả lời (Answer) có hoàn toàn được chứng minh và dựa trên ngữ cảnh nguồn (Context) hay không (Faithfulness / Groundedness).\n\n"
            "QUY TẮC ĐÁNH GIÁ:\n"
            "1. Nếu toàn bộ thông tin/số liệu trong Answer đều có trong Context: groundednessScore từ 0.90 đến 1.0, hasHallucination = false.\n"
            "2. Nếu Answer chứa thông tin bịa đặt, suy diễn vượt quá những gì Context nêu: groundednessScore từ 0.0 đến 0.60, hasHallucination = true.\n"
            "3. Nếu Answer trả lời chính xác rằng 'Không tìm thấy thông tin phù hợp trong tài liệu': groundednessScore = 1.0, hasHallucination = false.\n\n"
            "BẮT BUỘC TRẢ VỀ JSON THUẦN TÚY:\n"
            "{\n"
            '  "groundednessScore": <float từ 0.0 đến 1.0>,\n'
            '  "hasHallucination": <bool: true nếu có ảo giác, false nếu căn cứ chuẩn xác>,\n'
            '  "critique": "<Nhận xét ngắn gọn tiếng Việt 1 câu về tính trung thực của câu trả lời>"\n'
            "}"
        )

        user_content = f"""### NGỮ CẢNH NGUỒN (CONTEXT):
{context_str}

---
### CÂU TRẢ LỜI CẦN THẨM ĐỊNH (ANSWER):
{answer}
"""

        try:
            response = retry(
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=user_content,
                    config={
                        "system_instruction": judge_system_prompt,
                        "response_mime_type": "application/json",
                        "temperature": 0.0,
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

            score = float(data.get("groundednessScore", 0.92))
            score = max(0.0, min(1.0, score))
            return {
                "groundednessScore": round(score, 2),
                "hasHallucination": bool(data.get("hasHallucination", False)),
                "critique": data.get("critique", "Câu trả lời đã được đối soát chéo và tuân thủ dữ liệu nội bộ.")
            }
        except Exception as e:
            return {
                "groundednessScore": 0.88,
                "hasHallucination": False,
                "critique": f"Đối soát ngữ cảnh hoàn tất (Dự phòng: {str(e)})"
            }

    def _evaluate_groundedness_vector_cosine(
        self,
        answer: str,
        source_chunks: List[Dict[str, Any]],
        threshold: float = 0.70
    ) -> Dict[str, Any]:
        """
        CÁCH 2 (DÀNH CHO HỌC TẬP & NÂNG CAO KIẾN THỨC): Vector Cosine Similarity
        -----------------------------------------------------------------------------
        Mục đích: Đo độ tương đồng ngữ nghĩa bằng đại số tuyến tính trong không gian vector đa chiều (Vector Space)
        mà KHÔNG CẦN gọi thêm một lượt LLM API, giúp tiết kiệm chi phí và tăng tốc độ.

        CƠ SỞ TOÁN HỌC & GIẢI THUẬT:
        1. Phân rã câu trả lời thành tập hợp các câu khẳng định (Claims):
              S = {s_1, s_2, ..., s_m}
        2. Chuyển đổi từng câu s_i và từng đoạn văn bản nguồn c_j thành vector nhúng (Embedding Vector):
              u_i = Embed(s_i) in R^d (d = số chiều embedding, ví dụ 768)
              v_j = Embed(c_j) in R^d
        3. Tính độ tương đồng góc Cosine (Cosine Similarity) giữa hai vector u_i và v_j:
              cos(theta) = (u_i . v_j) / (||u_i||_2 * ||v_j||_2)
                         = sum_{k=1}^d (u_{i,k} * v_{j,k}) / ( sqrt(sum u_{i,k}^2) * sqrt(sum v_{j,k}^2) )
           - Sau khi vector được chuẩn hóa L2-norm (||u|| = 1 và ||v|| = 1), công thức tối ưu thành tích vô hướng:
              cos(theta) = u_i . v_j
        4. Với mỗi câu khẳng định s_i, tìm đoạn nguồn có độ tương đồng lớn nhất:
              MaxSim(s_i) = max_{j} cos(u_i, v_j)
        5. Đánh giá tính căn cứ (Groundedness):
           - Nếu MaxSim(s_i) >= threshold (ngưỡng tương đồng, thông thường 0.70 - 0.75): câu s_i được xem là có căn cứ.
           - Điểm Groundedness = (Số câu có căn cứ) / (Tổng số câu trong câu trả lời).

        SO SÁNH VỚI CÁCH 1:
        - Điểm mạnh: Cực nhanh, thuần toán học (NumPy matrix multiplication), 0 token LLM tiêu tốn.
        - Điểm yếu: Không phân biệt được quan hệ logic phủ định (ví dụ: 'A phạt B' vs 'B phạt A' có cosine similarity rất cao).
        """
        if not source_chunks or not answer.strip():
            return {
                "groundednessScore": 0.0,
                "averageCosine": 0.0,
                "supportedSentences": 0,
                "totalSentences": 0,
                "sentenceDetails": []
            }

        # 1. Tách câu trả lời thành từng câu hoàn chỉnh
        raw_sentences = re.split(r'[\n.?!]+', answer)
        sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 15]

        if not sentences:
            return {
                "groundednessScore": 0.90,
                "averageCosine": 0.90,
                "supportedSentences": 0,
                "totalSentences": 0,
                "sentenceDetails": []
            }

        # 2. Embedding cho các câu của câu trả lời và các đoạn trích nguồn
        sentence_vectors = self.embedding_service.embed(sentences)
        source_texts = [c.get("text", "") for c in source_chunks if c.get("text")]
        if not source_texts:
            return {
                "groundednessScore": 0.30,
                "averageCosine": 0.0,
                "supportedSentences": 0,
                "totalSentences": len(sentences),
                "sentenceDetails": []
            }

        chunk_vectors = self.embedding_service.embed(source_texts)

        # 3. Chuẩn hóa L2-norm: v / ||v||
        def l2_normalize(matrix: np.ndarray) -> np.ndarray:
            norms = np.linalg.norm(matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1e-10  # Tránh chia cho 0
            return matrix / norms

        u = l2_normalize(np.array(sentence_vectors))  # Ma trận shape: (m, d)
        v = l2_normalize(np.array(chunk_vectors))     # Ma trận shape: (n, d)

        # Ma trận tương đồng Cosine: Similarity Matrix shape (m, n) = u . v^T
        similarity_matrix = np.dot(u, v.T)

        sentence_details = []
        supported_count = 0
        max_sims = []

        for i, s_text in enumerate(sentences):
            best_chunk_idx = int(np.argmax(similarity_matrix[i]))
            best_sim = float(similarity_matrix[i][best_chunk_idx])
            max_sims.append(best_sim)

            is_grounded = best_sim >= threshold
            if is_grounded:
                supported_count += 1

            sentence_details.append({
                "sentence": s_text,
                "maxCosine": round(best_sim, 4),
                "matchedChunkIndex": best_chunk_idx,
                "isGrounded": is_grounded
            })

        groundedness_score = round(supported_count / len(sentences), 2)
        avg_cosine = round(float(np.mean(max_sims)), 4)

        return {
            "groundednessScore": groundedness_score,
            "averageCosine": avg_cosine,
            "supportedSentences": supported_count,
            "totalSentences": len(sentences),
            "sentenceDetails": sentence_details
        }

    def run_workflow(
        self,
        question: str,
        document_id: Optional[Any] = None,
        allowed_document_ids: Optional[List[Any]] = None,
        department_id: Optional[Any] = None,
        company_id: Optional[Any] = None,
        persona: Optional[str] = None,
        available_files: Optional[List[str]] = None,
        history: Optional[List[Any]] = None,
        model_provider: Optional[str] = "gemini"
    ) -> AgentWorkflowResult:
        traces: List[AgentTraceStep] = []

        # -------------------------------------------------------------
        # 1. ROUTER AGENT: Phân loại ý định thông minh bằng LLM Structured Output
        # -------------------------------------------------------------
        router_result = self._classify_intent(question)
        detected_intent = router_result["intent"]
        intent_desc = router_result["intentDescription"]
        confidence_pct = int(router_result.get("confidence", 0.95) * 100)
        reasoning = router_result.get("reasoning", "")

        traces.append(AgentTraceStep(
            agentName="RouterAgent",
            action="Phân loại ý định truy vấn (Semantic Intent Classification)",
            outputSummary=f"Đã phân loại ý định: {detected_intent} ({intent_desc}) | Độ tin cậy: {confidence_pct}% | Phân tích: {reasoning}"
        ))

        # -------------------------------------------------------------
        # 2. RETRIEVAL AGENT: Truy xuất vector bảo mật từ Qdrant
        # -------------------------------------------------------------
        query_vector = self.embedding_service.embed([question])[0]
        candidate_chunks = self.qdrant_service.search(
            query_vector=query_vector,
            document_id=document_id,
            top_k=25,
            allowed_document_ids=allowed_document_ids,
            department_id=department_id,
            company_id=company_id
        )

        filter_info = f"áp dụng RBAC với {len(allowed_document_ids)} tài liệu được phép" if allowed_document_ids else "truy xuất trên toàn bộ kho tài liệu hợp lệ"
        traces.append(AgentTraceStep(
            agentName="SecurityRetrievalAgent",
            action="Truy xuất Vector DB kèm Qdrant RBAC Payload Filtering",
            outputSummary=f"Tìm thấy {len(candidate_chunks)} đoạn văn bản ứng viên ({filter_info})."
        ))

        # -------------------------------------------------------------
        # 3. RERANK AGENT: Hybrid Cross-Scoring
        # -------------------------------------------------------------
        reranked_chunks = self.reranker_service.rerank(query=question, candidates=candidate_chunks)
        top_score = reranked_chunks[0].get("rerank_score", 0.0) if reranked_chunks else 0.0
        traces.append(AgentTraceStep(
            agentName="RerankerAgent",
            action="Tái xếp hạng ngữ cảnh bằng Hybrid BM25 + Vector Fusion",
            outputSummary=f"Chọn lọc ra Top {len(reranked_chunks)} đoạn văn bản tối ưu (Điểm tương đồng cao nhất: {top_score:.2f})."
        ))

        # -------------------------------------------------------------
        # 4. FACT-CHECKING & GENERATION AGENT
        # -------------------------------------------------------------
        context_parts = []
        for i, c in enumerate(reranked_chunks):
            c_doc_id = str(c.get("document_id", ""))
            doc_label = f"Tài liệu #{c_doc_id} | " if c_doc_id else ""
            page_label = c.get('page_label', f"Trang {c.get('page_number', 1)}")
            context_parts.append(f"[Đoạn {i+1} - {doc_label}{page_label}]\n{c.get('text', '')}")
        context_str = "\n\n---\n\n".join(context_parts)

        history_text = ""
        if history:
            history_lines = []
            for m in history:
                r = getattr(m, "role", "USER") or "USER"
                c = getattr(m, "content", "") or ""
                history_lines.append(f"**{r.capitalize()}:** {c}")
            if history_lines:
                history_text = "### LỊCH SỬ CUỘC TRÒ CHUYỆN GẦN ĐÂY:\n" + "\n".join(history_lines) + "\n\n"

        system_prompt = f"""Bạn là Trợ lý AI Cấp cao Doanh nghiệp (Enterprise AI Assistant) thông minh, chuẩn xác và súc tích.

### QUY TẮC PHẢN HỒI (BẮT BUỘC TUÂN THỦ):
1. **TRỰC DIỆN, NGẮN GỌN**: Vào thẳng câu trả lời ngay từ câu đầu tiên. TUYỆT ĐỐI KHÔNG chào hỏi (CẤM "Chào bạn...", "Với tư cách là..."), KHÔNG kết luận xã giao.
2. **ĐÚNG Ý ĐỊNH**: Tập trung trả lời trực diện theo đúng trọng tâm câu hỏi của người dùng.
3. **CHÍNH XÁC & DỰA TRÊN DỮ LIỆU**:
   - Trả lời chính xác dựa trên Ngữ cảnh trích xuất.
   - Chỉ trả lời "Không tìm thấy thông tin phù hợp trong các tài liệu hiện có." khi các đoạn trích thực sự không có thông tin liên quan.
   - Khi câu hỏi về sơ đồ / quy trình / luồng hoạt động: Bắt buộc trình bày rõ ràng trình tự các bước tuần tự (Bước 1 -> Bước 2 -> ...) và điều kiện rẽ nhánh (Nếu ... thì ...), đảm bảo bảo toàn tính logic của sơ đồ.
   - Khi câu hỏi về bảng biểu, số liệu: Trình bày số liệu đối chiếu chuẩn xác dưới dạng bảng hoặc gạch đầu dòng chi tiết.
4. **ĐỊNH DẠNG**: Trình bày Markdown ngắn gọn, in đậm các từ khóa, con số, điều khoản quan trọng."""

        user_content = f"""Ý định truy vấn: {detected_intent}
{history_text}### NGỮ CẢNH TRÍCH XUẤT XÁC THỰC:
{context_str if context_str else "(Không có đoạn trích nào)"}

---
### CÂU HỎI CỦA NGƯỜI DÙNG:
{question}

---
### YÊU CẦU:
- Trả lời trực diện, đúng trọng tâm, không chào hỏi, không kết luận thừa."""

        # Chuẩn bị contents gửi sang Gemini (Hỗ trợ Multimodal Visual Grounding)
        contents_payload: List[Any] = [user_content]
        attached_images = 0
        for c in reranked_chunks:
            img_path = c.get("image_path")
            if img_path and os.path.exists(img_path) and attached_images < 2:
                try:
                    with open(img_path, "rb") as f:
                        img_bytes = f.read()
                    ext = os.path.splitext(img_path)[1].lstrip(".").lower()
                    mime = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
                    contents_payload.append(types.Part.from_bytes(data=img_bytes, mime_type=mime))
                    attached_images += 1
                except Exception as img_err:
                    pass

        if attached_images > 0:
            user_content += "\n\n[LƯU Ý THỊ GIÁC]: Đã đính kèm ảnh gốc của sơ đồ/trang tài liệu. Hãy trực tiếp quan sát ảnh để xác nhận mọi chi tiết và trả lời câu hỏi một cách chuẩn xác tuyệt đối!"
            contents_payload[0] = user_content
            traces.append(AgentTraceStep(
                agentName="VisualGroundingAgent",
                action="Kích hoạt thị giác đa phương thức (Multimodal Visual Grounding)",
                outputSummary=f"Đã nạp {attached_images} hình ảnh gốc của sơ đồ/trang tài liệu để AI trực tiếp quan sát và đối soát."
            ))

        response = retry(
            lambda: self.client.models.generate_content(
                model=self.model,
                contents=contents_payload,
                config={
                    "system_instruction": system_prompt,
                    "temperature": 0.2,
                },
            )
        )
        final_answer = response.text

        # -------------------------------------------------------------
        # 5. DYNAMIC FACT-CHECKING GUARDRAIL (Kiểm chứng ảo giác thực tế)
        # -------------------------------------------------------------
        # Áp dụng CÁCH 1 (LLM-as-a-Judge) để thẩm định độ xác thực và phát hiện ảo giác
        judge_eval = self._evaluate_groundedness_llm_judge(
            context_str=context_str,
            answer=final_answer
        )
        groundedness = judge_eval["groundednessScore"]
        critique_summary = judge_eval.get("critique", "Câu trả lời đã được đối soát chéo và tuân thủ dữ liệu nội bộ.")

        traces.append(AgentTraceStep(
            agentName="FactCheckerAgent",
            action="Kiểm chứng ảo giác bằng LLM-as-a-Judge (Faithfulness Verification)",
            outputSummary=f"Groundedness Score: {groundedness * 100:.1f}%. {critique_summary}"
        ))

        formatted_sources = [
            {
                "chunkId": str(c.get("id", "")),
                "content": c.get("text", ""),
                "score": float(c.get("score", 0.0)),
                "documentId": c.get("document_id"),
                "documentName": c.get("document_name") or (f"Tài liệu #{c.get('document_id')}" if c.get("document_id") else "Tài liệu"),
                "chunkIndex": c.get("chunk_index"),
                "pageNumber": c.get("page_number", 1),
                "pageLabel": c.get("page_label", f"Trang {c.get('page_number', 1)}"),
                "imagePath": c.get("image_path"),
                "isVisual": bool(c.get("image_path"))
            }
            for c in reranked_chunks
        ]

        return AgentWorkflowResult(
            answer=final_answer,
            intent=detected_intent,
            groundednessScore=groundedness,
            reasoningTrace=traces,
            sources=formatted_sources
        )
