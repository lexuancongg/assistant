from pydantic import BaseModel, Field
from typing import List, Optional, Union, Any
from uuid import UUID

class SourceChunk(BaseModel):
    chunkId: Union[UUID, str]
    content: str
    score: float
    documentId: Optional[Union[str, int, UUID, Any]] = None
    chunkIndex: Optional[int] = None
    page_number: Optional[int] = None


class ChatHistory(BaseModel):
    role: str
    content: str


class RagRequest(BaseModel):
    documentId: Optional[Union[str, int, UUID, Any]] = None
    question: str = Field(..., min_length=1)
    persona: Optional[str] = None
    history: Optional[List[ChatHistory]] = None
    availableFiles: Optional[List[str]] = None


class RagResponse(BaseModel):
    answer: str
    sources: List[SourceChunk] = Field(default_factory=list)