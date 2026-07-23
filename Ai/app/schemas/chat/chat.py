from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class SourceChunk(BaseModel):
    chunkId: UUID
    content: str
    score: float
    documentId: Optional[int] = None
    chunkIndex: Optional[int] = None
    page_number: Optional[int] = None


class ChatHistory(BaseModel):
    role: str
    content: str


class RagRequest(BaseModel):
    documentId: Optional[int] = None
    question: str = Field(..., min_length=1)
    persona: Optional[str] = None
    history: Optional[List[ChatHistory]] = None


class RagResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]