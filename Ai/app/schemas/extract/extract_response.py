from pydantic import BaseModel, Field
from typing import Dict, Any, List


class ChunkInfo(BaseModel):
    chunkIndex: int
    content: str
    embeddingId: str  # point id trong Qdrant


class ExtractResponse(BaseModel):
    documentType: str
    summary: str
    ocrText: str

    metadata: Dict[str, Any]
    chunks: List[ChunkInfo] = Field(default_factory=list)
    confidence:float