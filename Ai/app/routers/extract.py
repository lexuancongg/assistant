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
async def extract( request: ExtractRequest):

    print("documentId:", request.documentId)
    print("filePath:", request.filePath)

    return service.extract(request)