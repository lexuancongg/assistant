import re

class ChunkService:

    def __init__(self, size: int = 1000, overlap: int = 100):
        self.size = size
        self.overlap = overlap

    def chunk(self, text: str) -> list[str]:
        # Tách thành câu trước
        sentences = self._split_sentences(text)

        chunks = []
        current = ""

        for sentence in sentences:
            # Nếu thêm câu này vào vẫn chưa đầy → ghép vào
            if len(current) + len(sentence) <= self.size:
                current += sentence
            else:
                # Chunk hiện tại đã đủ → lưu lại
                if current.strip():
                    chunks.append(current.strip())
                # Bắt đầu chunk mới với overlap từ chunk trước
                current = current[-self.overlap:] + sentence

        # Đừng quên chunk cuối
        if current.strip():
            chunks.append(current.strip())

        return chunks

    @staticmethod
    def _split_sentences(text: str) -> list[str]:
        # Cắt tại dấu . ! ? và xuống dòng, giữ lại dấu phân cách
        return re.split(r'(?<=[.!?\n])\s+', text)