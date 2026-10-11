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


class AgentTraceStep(BaseModel):
    agentName: str
    action: str
    outputSummary: str
    status: str = "SUCCESS"


class ChatHistory(BaseModel):
    role: str
    content: str


class RagRequest(BaseModel):
    documentId: Optional[Union[str, int, UUID, Any]] = None
    question: str = Field(..., min_length=1)
    persona: Optional[str] = None
    history: Optional[List[ChatHistory]] = None
    availableFiles: Optional[List[str]] = None
    mode: Optional[str] = "STANDARD_RAG"  # STANDARD_RAG | AGENTIC_WORKFLOW
    modelProvider: Optional[str] = "gemini"  # gemini | deepseek
    allowedDocumentIds: Optional[List[Union[str, int, UUID, Any]]] = None


class RagResponse(BaseModel):
    answer: str
    sources: List[SourceChunk] = Field(default_factory=list)
    mode: Optional[str] = "STANDARD_RAG"
    intent: Optional[str] = None
    groundednessScore: Optional[float] = None
    reasoningTrace: Optional[List[AgentTraceStep]] = None
    promptTokens: Optional[int] = None
    completionTokens: Optional[int] = None
    totalTokens: Optional[int] = None