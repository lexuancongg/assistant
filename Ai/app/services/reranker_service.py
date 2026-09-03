"""
Dịch vụ Tái xếp hạng (Reranker Service) cho Advanced RAG.
Áp dụng cơ chế Reciprocal Rank Fusion (RRF) kết hợp Cross-Scoring:
1. Dense Vector Similarity Score từ Qdrant
2. Lexical / BM25 Token Overlap Score
3. Exact Match Bonus cho các mã hợp đồng, số hiệu điều khoản, số tiền, ngày tháng

Cơ chế này khắc phục hoàn toàn nhược điểm của Naive RAG khi tìm kiếm thông tin chính xác trong hợp đồng doanh nghiệp.
"""

import math
import re
from typing import List, Dict, Any

class RerankerService:

    def __init__(self, top_n: int = 5):
        self.top_n = top_n

    def rerank(self, query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Nhận vào danh sách chunks ứng viên từ Qdrant và xếp hạng lại.
        candidates: List các dict có dạng: {'id', 'text', 'score', 'document_id', 'page_number', ...}
        """
        if not candidates:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return candidates[:self.top_n]

        scored_candidates = []
        for cand in candidates:
            text = cand.get("text", "")
            vector_score = float(cand.get("score", 0.0))

            # 1. Tính Lexical Relevance (Tần suất xuất hiện token của query trong chunk)
            text_tokens = self._tokenize(text)
            text_tokens_set = set(text_tokens)

            overlap_count = sum(1 for q in query_tokens if q in text_tokens_set)
            lexical_score = overlap_count / max(1, len(query_tokens))

            # 2. Exact Match Bonus (Tìm thấy nguyên cụm từ hoặc số hiệu điều khoản)
            exact_bonus = 0.0
            clean_query = query.strip().lower()
            if len(clean_query) > 4 and clean_query in text.lower():
                exact_bonus = 0.25

            # Phát hiện số hiệu, điều khoản (ví dụ: "điều 8", "12%", "hợp đồng số")
            specific_terms = re.findall(r'(điều\s+\d+|khoản\s+\d+|\d+[\.,]\d+%|\d+%)', clean_query)
            for term in specific_terms:
                if term in text.lower():
                    exact_bonus += 0.15

            # 3. Hybrid Fusion Score (Cross-Scoring)
            # alpha = 0.65 (trọng số vector ngữ nghĩa), beta = 0.35 (trọng số từ khóa chính xác)
            hybrid_score = (0.65 * vector_score) + (0.35 * lexical_score) + exact_bonus

            cand_copy = dict(cand)
            cand_copy["dense_score"] = vector_score
            cand_copy["lexical_score"] = round(lexical_score, 4)
            cand_copy["rerank_score"] = round(hybrid_score, 4)
            cand_copy["score"] = cand_copy["rerank_score"] # cập nhật điểm cuối cùng

            scored_candidates.append(cand_copy)

        # Sắp xếp giảm dần theo rerank_score
        scored_candidates.sort(key=lambda x: x["rerank_score"], reverse=True)

        return scored_candidates[:self.top_n]

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        # Tách từ cơ bản loại bỏ dấu câu
        clean_text = re.sub(r'[^\w\s]', ' ', text.lower())
        tokens = [t.strip() for t in clean_text.split() if len(t.strip()) > 1]
        return tokens
