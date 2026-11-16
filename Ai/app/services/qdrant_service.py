import uuid
import os
import logging
from typing import Any, Optional, List, Dict
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, MatchAny,
    PayloadSchemaType
)

logger = logging.getLogger(__name__)

COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "documents")
VECTOR_SIZE = int(os.getenv("VECTOR_SIZE", "1536"))
BATCH_SIZE = 100


class QdrantService:

    def __init__(self):
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY") or None
        self.client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key,
            timeout=60,
            check_compatibility=False
        )
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            existing = [c.name for c in self.client.get_collections().collections]
            if COLLECTION_NAME not in existing:
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                )
            # Tạo Payload Index cho document_id để tránh Full Scan
            try:
                self.client.create_payload_index(
                    collection_name=COLLECTION_NAME,
                    field_name="document_id",
                    field_schema=PayloadSchemaType.KEYWORD
                )
            except Exception:
                pass
        except Exception as e:
            logger.warning("Lưu ý khi kiểm tra collection Qdrant: %s", e)

    def upsert(
            self,
            chunks: list[str],
            vectors: list[list[float]],
            document_id: Any = None,
            payloads: Optional[List[Dict[str, Any]]] = None,
            department_id: Any = None,
            company_id: Any = None,
    ) -> list[str]:
        if len(chunks) != len(vectors):
            raise ValueError(
                f"Số lượng chunks ({len(chunks)}) không khớp số lượng vectors ({len(vectors)})"
            )

        points = []
        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            custom_payload = payloads[i] if (payloads and i < len(payloads)) else {}
            point_payload = {
                "document_id": str(document_id) if document_id is not None else None,
                "chunk_index": i,
                "text": chunk,
            }
            if department_id is not None:
                point_payload["department_id"] = str(department_id)
            if company_id is not None:
                point_payload["company_id"] = str(company_id)

            if custom_payload:
                point_payload.update(custom_payload)

            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload=point_payload,
                )
            )

        for i in range(0, len(points), BATCH_SIZE):
            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=points[i:i + BATCH_SIZE],
            )

        return [point.id for point in points]

    def save(
            self,
            chunks: list[str] = None,
            vectors: list[list[float]] = None,
            document_id: Any = None,
            payloads: list = None,
            **kwargs,
    ) -> list[str]:
        actual_chunks = chunks if chunks is not None else kwargs.get("chunks", [])
        actual_vectors = vectors if vectors is not None else kwargs.get("vectors", [])
        actual_doc_id = document_id if document_id is not None else kwargs.get("document_id")
        actual_payloads = payloads if payloads is not None else kwargs.get("payloads")
        return self.upsert(
            chunks=actual_chunks,
            vectors=actual_vectors,
            document_id=actual_doc_id,
            payloads=actual_payloads,
            department_id=kwargs.get("department_id"),
            company_id=kwargs.get("company_id")
        )

    def search(
            self,
            query_vector: list[float],
            document_id: Any = None,
            top_k: int = 5,
            allowed_document_ids: list[Any] = None,
            department_id: Any = None,
            company_id: Any = None,
            with_vectors: bool = False,
    ) -> list[dict]:
        must_conditions = []
        if document_id is not None and str(document_id) not in ("0", "", "None"):
            doc_str = str(document_id)
            doc_int = None
            try:
                doc_int = int(document_id)
            except (ValueError, TypeError):
                pass
            should_conds = [FieldCondition(key="document_id", match=MatchValue(value=doc_str))]
            if doc_int is not None:
                should_conds.append(FieldCondition(key="document_id", match=MatchValue(value=doc_int)))
            must_conditions.append(Filter(should=should_conds))
        elif allowed_document_ids is not None:
            str_ids = [str(d) for d in allowed_document_ids if str(d) not in ("0", "", "None")]
            int_ids = []
            for d in allowed_document_ids:
                try:
                    int_ids.append(int(d))
                except (ValueError, TypeError):
                    pass

            should_clauses = []
            if str_ids:
                should_clauses.append(FieldCondition(key="document_id", match=MatchAny(any=str_ids)))
            if int_ids:
                should_clauses.append(FieldCondition(key="document_id", match=MatchAny(any=int_ids)))

            if should_clauses:
                must_conditions.append(Filter(should=should_clauses))
            elif len(allowed_document_ids) == 0:
                return []

        if department_id is not None and str(department_id) not in ("0", "", "None"):
            must_conditions.append(FieldCondition(key="department_id", match=MatchValue(value=str(department_id))))

        if company_id is not None and str(company_id) not in ("0", "", "None"):
            must_conditions.append(FieldCondition(key="company_id", match=MatchValue(value=str(company_id))))

        query_filter = Filter(must=must_conditions) if must_conditions else None

        results = self.client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=query_filter,
            limit=top_k,
            with_payload=True,
            with_vectors=with_vectors,
        )

        output = []
        for r in results.points:
            item = {
                "id": r.id,
                "text": r.payload.get("text", "") if r.payload else "",
                "document_id": r.payload.get("document_id") if r.payload else None,
                "chunk_index": r.payload.get("chunk_index") if r.payload else None,
                "score": r.score,
                "image_path": r.payload.get("image_path") if r.payload else None,
                "page_number": r.payload.get("page_number") if r.payload else None,
                "is_diagram": r.payload.get("is_diagram", False) if r.payload else False,
            }
            if with_vectors and r.vector is not None:
                item["vector"] = r.vector
            output.append(item)

        return output

    def delete_by_document(self, document_id: Any):
        doc_str = str(document_id)
        should_conds = [FieldCondition(key="document_id", match=MatchValue(value=doc_str))]
        try:
            doc_int = int(document_id)
            should_conds.append(FieldCondition(key="document_id", match=MatchValue(value=doc_int)))
        except (ValueError, TypeError):
            pass

        filter_condition = Filter(should=should_conds)

        # 1. Tìm các image_path liên quan để dọn dẹp file ảnh vật lý trên đĩa
        try:
            records, _ = self.client.scroll(
                collection_name=COLLECTION_NAME,
                scroll_filter=filter_condition,
                limit=1000,
                with_payload=True,
                with_vectors=False
            )
            for record in records:
                if record.payload:
                    img_path = record.payload.get("image_path")
                    if img_path and os.path.exists(img_path):
                        try:
                            os.remove(img_path)
                            logger.info("Đã xóa file ảnh sơ đồ dọn dẹp đĩa: %s", img_path)
                        except Exception as rm_err:
                            logger.warning("Không thể xóa file ảnh %s: %s", img_path, rm_err)
        except Exception as sc_err:
            logger.debug("Lỗi khi scroll tìm image_path để dọn dẹp: %s", sc_err)

        # 2. Xóa points trong Qdrant
        try:
            from qdrant_client.models import FilterSelector
            selector = FilterSelector(filter=filter_condition)
        except Exception:
            selector = filter_condition

        self.client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=selector,
        )
