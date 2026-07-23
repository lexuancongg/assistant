import easyocr
import fitz
import requests
from PIL import Image
import numpy as np
from urllib.parse import urlparse
import os
from io import BytesIO

class OCRService:

    def __init__(self):
        self.reader = easyocr.Reader(['en', 'vi'])

    def extract_text_from_image(self, image):
        results = self.reader.readtext(image)
        return " ".join([text for (_, text, _) in results])

    def extract_text_from_bytes(self, image_bytes: bytes) -> str:
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            image_array = np.array(image)
            return self.extract_text_from_image(image_array)
        except Exception:
            # Fallback: treat bytes as a PDF/image stream via fitz if PIL parsing fails.
            doc = fitz.open(stream=image_bytes, filetype="png")
            full_text = []
            for page in doc:
                pix = page.get_pixmap()
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
                full_text.append(self.extract_text_from_image(img))
            doc.close()
            return "\n".join(full_text)

    def _load_bytes(self, path: str) -> bytes:
        """Hỗ trợ cả URL (http/https) lẫn local file path."""
        if path.startswith("http://") or path.startswith("https://"):
            response = requests.get(path, timeout=30)
            response.raise_for_status()
            return response.content
        else:
            with open(path, "rb") as f:
                return f.read()

    def extract_text(self, path: str):
        file_bytes = self._load_bytes(path)

        # Lấy phần đuôi file để fitz nhận diện đúng định dạng (png, jpg, pdf...)
        ext = os.path.splitext(urlparse(path).path)[1].lstrip(".").lower() or "png"

        doc = fitz.open(stream=file_bytes, filetype=ext)
        full_text = ""

        for page in doc:
            pix = page.get_pixmap()
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)

            text = self.extract_text_from_image(img)
            full_text += text + "\n"

        doc.close()
        return full_text