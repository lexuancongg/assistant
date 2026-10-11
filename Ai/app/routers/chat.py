from fastapi import APIRouter, HTTPException
from app.schemas.chat.chat import RagRequest, RagResponse
from app.schemas.chat.search import SearchRequest, SearchResponse
from app.services.chat_service import ChatService
from app.services.agent_service import EnterpriseAgentEngine, AgentWorkflowResult

router = APIRouter(prefix="/api/v1", tags=["Chat"])
chat_service = ChatService()
agent_engine = EnterpriseAgentEngine()


@router.post("/chat", response_model=RagResponse)
def chat_endpoint(request: RagRequest):
    """
    Standard RAG Endpoint (Truy vấn RAG cơ bản):
    Qdrant Vector Retrieval -> Reranker -> Gemini generation.
    """
    try:
        return chat_service.ask(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agent/chat", response_model=AgentWorkflowResult)
def agent_chat_endpoint(request: RagRequest):
    """
    Multi-Agent Workflow Endpoint (Truy vấn theo đồ thị trạng thái Đa Tác tử):
    Router Agent (Phân loại ý định) -> Security Retrieval Agent (RBAC Qdrant) 
    -> Reranker Agent (BM25 + Dense) -> Fact-Checking Agent (Hallucination Guardrail & Tracing).
    Dùng để so sánh đối chiếu hiệu năng, độ trễ và độ chính xác với endpoint /chat thông thường.
    """
    try:
        return agent_engine.run_workflow(
            question=request.question,
            document_id=request.documentId,
            allowed_document_ids=getattr(request, "allowedDocumentIds", None),
            department_id=getattr(request, "departmentId", None),
            company_id=getattr(request, "companyId", None),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SearchResponse)
def search_endpoint(request: SearchRequest):
    try:
        return chat_service.search(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))