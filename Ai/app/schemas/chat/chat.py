from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class SourceChunk(BaseModel):
    chunkId: UUID
    content: str
    score: float
    page_number: Optional[int] = None


class RagRequest(BaseModel):
    documentId: Optional[int] = None
    question: str = Field(..., min_length=1)


class RagResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]