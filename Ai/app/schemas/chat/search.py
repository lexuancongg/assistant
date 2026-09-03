from pydantic import BaseModel, Field
from typing import List, Optional, Union, Any
from uuid import UUID


class SearchSourceChunk(BaseModel):
    chunkId: Union[UUID, str]
    content: str
    score: float
    documentId: Optional[Union[str, int, UUID, Any]] = None
    chunkIndex: Optional[int] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    documentId: Optional[Union[str, int, UUID, Any]] = None
    topK: Optional[int] = None


class SearchResponse(BaseModel):
    sources: List[SearchSourceChunk] = Field(default_factory=list)
