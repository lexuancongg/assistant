from pydantic import BaseModel

class ExtractRequest(BaseModel):
    documentId: int
    filePath: str