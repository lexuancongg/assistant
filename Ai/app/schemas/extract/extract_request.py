from pydantic import BaseModel
from typing import Optional, Union, Any
from uuid import UUID

class ExtractRequest(BaseModel):
    documentId: Optional[Union[str, int, UUID, Any]] = None
    filePath: str