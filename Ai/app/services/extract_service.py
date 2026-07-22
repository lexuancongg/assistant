from app.schemas.extract.extract_request import ExtractRequest
from app.schemas.extract.extract_response import ExtractResponse, ChunkInfo

from app.services.document_reader import DocumentReader
from app.services.openai_service import OpenAIService
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService


class ExtractService:

    def __init__(self):
        self.document_reader = DocumentReader()
        self.openai_service = OpenAIService()
        self.chunk_service = ChunkService()
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()

    def extract(self, request: ExtractRequest):

        # 1. Đọc file (PDF / DOCX / IMAGE / EMAIL)
        text = self.document_reader.read(request.filePath)

        print(text)
    
        # 2. Validate text
        if not text or not text.strip():
            raise Exception("Cannot extract text from document")

        # 3. AI Extract (type + metadata + summary)
        ai_result = self.openai_service.extract(text)

        # 4. Chunk text
        chunks = self.chunk_service.chunk(text)

        # 5. Embedding
        vectors = self.embedding_service.embed(chunks)


        point_ids = self.qdrant_service.save(
            document_id=request.documentId,
            chunks=chunks,
            vectors=vectors
        )
        chunk_infos = [
            ChunkInfo(chunkIndex=i, content=chunks[i], embeddingId=point_ids[i])
            for i in range(len(chunks))
        ]

        response = ExtractResponse(
            documentType=ai_result.documentType,
            summary=ai_result.summary,
            ocrText=text,
            metadata=ai_result.metadata,
            chunks=chunk_infos,
            confidence =  ai_result.confidence,
        )

        print(response.model_dump_json(indent=2))
        # 7. Return response
        return ExtractResponse(
            documentType=ai_result.documentType.upper(),
            summary=ai_result.summary,
            ocrText=text,
            metadata=ai_result.metadata,
            chunks=chunk_infos,
            confidence = ai_result.confidence,
        )