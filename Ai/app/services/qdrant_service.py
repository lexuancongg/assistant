import uuid
import os
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
)

COLLECTION_NAME = "documents"
VECTOR_SIZE = 1536
BATCH_SIZE = 100


class QdrantService:

    def __init__(self):
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY") or None
        self.client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key,
        )
        self._ensure_collection()

    def _ensure_collection(self):
        existing = [c.name for c in self.client.get_collections().collections]
        if COLLECTION_NAME not in existing:
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )

    def save(self, document_id: str, chunks: list[str], vectors: list[list[float]]) -> list[str]:
        if not chunks or not vectors:
            return []

        if len(chunks) != len(vectors):
            raise ValueError(
                f"Số lượng chunks ({len(chunks)}) không khớp số lượng vectors ({len(vectors)})"
            )

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "document_id": document_id,
                    "chunk_index": i,
                    "text": chunk,
                },
            )
        for i, (chunk, vector) in enumerate(zip(chunks, vectors))
        ]

        for i in range(0, len(points), BATCH_SIZE):
            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=points[i:i + BATCH_SIZE],
            )

        return [point.id for point in points]
    def search(
            self,
            query_vector: list[float],
            document_id: int = 0,
            top_k: int = 5,
    ) -> list[dict]:
        query_filter = None
        print("documentId, ",document_id)
        if document_id:
            query_filter = Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            )

        results = self.client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=query_filter,
            limit=top_k,
            with_payload=True,
        )

        return [
            {
                "id": r.id,              # <-- thêm dòng này
                "text": r.payload["text"],
                "document_id": r.payload["document_id"],
                "chunk_index": r.payload["chunk_index"],
                "score": r.score,
            }
            for r in results.points
        ]

    def delete_by_document(self, document_id: str):
        self.client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
        )