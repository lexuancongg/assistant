import logging
import os
from google import genai
from google.genai import types
from app.utils.retry import retry
logger = logging.getLogger(__name__)


class EmbeddingService:

    BATCH_SIZE = 100  # Gemini embedding API giới hạn nhỏ hơn OpenAI, an toàn với 100

    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Thiếu biến môi trường GEMINI_API_KEY")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-embedding-001"  # embedding model hiện tại của Gemini

    def embed(self, chunks: list[str]) -> list[list[float]]:
        if not chunks:
            return []

        results = []

        for i in range(0, len(chunks), self.BATCH_SIZE):
            batch = chunks[i : i + self.BATCH_SIZE]
            logger.debug(
                "Embedding batch %d/%d",
                i // self.BATCH_SIZE + 1,
                -(-len(chunks) // self.BATCH_SIZE),  # ceiling division
            )

            response = retry(
                lambda: self.client.models.embed_content(
                    model=self.model,
                    contents=batch,
                    config=types.EmbedContentConfig(
                        task_type="RETRIEVAL_DOCUMENT",
                        output_dimensionality=1536,
                    ),
                )
            )

            results.extend(e.values for e in response.embeddings)

        return results