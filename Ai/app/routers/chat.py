from fastapi import APIRouter, HTTPException
from app.schemas.chat.chat import RagRequest, RagResponse
from app.schemas.chat.search import SearchRequest, SearchResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/v1", tags=["Chat"])
chat_service = ChatService()


@router.post("/chat", response_model=RagResponse)
async def chat_endpoint(request: RagRequest):
    try:
        return  chat_service.ask(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    try:
        return chat_service.search(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))