from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID


class SearchSourceChunk(BaseModel):
    chunkId: UUID
    content: str
    score: float
    documentId: Optional[int] = None
    chunkIndex: Optional[int] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    documentId: Optional[int] = None
    topK: Optional[int] = None


class SearchResponse(BaseModel):
    sources: List[SearchSourceChunk]
