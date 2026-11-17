import logging
from fastapi import APIRouter

from app.schemas.extract.extract_request import ExtractRequest
from app.schemas.extract.extract_response import ExtractResponse
from app.services.extract_service import ExtractService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["Extract"]
)

service = ExtractService()


@router.post("/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest):
    logger.info("Extracting documentId: %s from filePath: %s", request.documentId, request.filePath)
    return service.extract(request)


@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    logger.info("Deleting Qdrant vectors for documentId: %s", document_id)
    service.qdrant_service.delete_by_document(document_id)
    return {"status": "success", "document_id": document_id}
