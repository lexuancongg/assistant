from fastapi import APIRouter

from app.schemas.extract.extract_request import ExtractRequest
from app.schemas.extract.extract_response import ExtractResponse
from app.services.extract_service import ExtractService


router = APIRouter(
    prefix="/api/v1",
    tags=["Extract"]
)

service = ExtractService()


@router.post("/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest):

    print("documentId:", request.documentId)
    print("filePath:", request.filePath)

    return service.extract(request)


@router.delete("/documents/{document_id}")
def delete_document(document_id: str):
    print("Deleting Qdrant vectors for documentId:", document_id)
    service.qdrant_service.delete_by_document(document_id)
    return {"status": "success", "document_id": document_id}