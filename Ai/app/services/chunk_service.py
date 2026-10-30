import re
from typing import List, Dict, Any, Tuple, Optional

class ChunkService:

    def __init__(self, size: int = 1000, overlap: int = 100):
        self.size = size
        self.overlap = overlap

    def chunk(self, text: str) -> List[str]:
        """Tương thích ngược: trả về danh sách các chuỗi text chunk."""
        items = self.chunk_with_metadata(text)
        return [item["text"] for item in items]

    def chunk_with_metadata(self, text: str) -> List[Dict[str, Any]]:
        """
        Cắt chunk thông minh kèm metadata (Visual Grounding Payload):
        - Nhận diện các khối sơ đồ/ảnh nguyên vẹn (Atomic Diagram Blocks).
        - Trích xuất tự động `image_path`, `page_number`, `is_diagram` vào payload.
        """
        if not text or not text.strip():
            return []

        sections = self._extract_atomic_sections(text)
        all_chunks: List[Dict[str, Any]] = []

        for section_type, content in sections:
            if not content.strip():
                continue

            if section_type == "DIAGRAM":
                # Trích xuất image_path và page_number nếu có trong header
                img_path, page_num = self._extract_diagram_metadata(content)

                if len(content) <= max(self.size * 2, 2500):
                    all_chunks.append({
                        "text": content.strip(),
                        "image_path": img_path,
                        "page_number": page_num,
                        "is_diagram": True
                    })
                else:
                    sub_chunks = self._chunk_large_diagram(content)
                    for sc in sub_chunks:
                        all_chunks.append({
                            "text": sc,
                            "image_path": img_path,
                            "page_number": page_num,
                            "is_diagram": True
                        })
            else:
                text_chunks = self._chunk_normal_text(content)
                for tc in text_chunks:
                    all_chunks.append({
                        "text": tc,
                        "image_path": None,
                        "page_number": None,
                        "is_diagram": False
                    })

        return all_chunks

    def _chunk_normal_text(self, text: str) -> List[str]:
        sentences = self._split_sentences(text)
        chunks = []
        current = ""

        for sentence in sentences:
            if len(current) + len(sentence) <= self.size:
                current += sentence
            else:
                if current.strip():
                    chunks.append(current.strip())
                overlap_text = current[-self.overlap:] if len(current) > self.overlap else current
                current = overlap_text + sentence

        if current.strip():
            chunks.append(current.strip())

        return chunks

    def _chunk_large_diagram(self, diagram_text: str) -> List[str]:
        """Cắt một sơ đồ rất dài nhưng luôn giữ lại tiêu đề sơ đồ cho từng chunk con."""
        lines = diagram_text.strip().split("\n")
        header = lines[0] if lines else ""
        if len(lines) > 1 and lines[1].startswith("---"):
            header += "\n" + lines[1]

        sub_chunks = []
        current_sub = header + "\n"

        for line in lines[2:]:
            if len(current_sub) + len(line) + 1 <= self.size:
                current_sub += line + "\n"
            else:
                if current_sub.strip():
                    sub_chunks.append(current_sub.strip())
                current_sub = header + "\n(Tiếp theo sơ đồ)\n" + line + "\n"

        if current_sub.strip():
            sub_chunks.append(current_sub.strip())

        return sub_chunks if sub_chunks else [diagram_text.strip()]

    def _extract_atomic_sections(self, text: str) -> List[Tuple[str, str]]:
        """
        Nhận diện và phân tách các khối sơ đồ/ảnh (Atomic Diagram Blocks)
        được bọc bởi '--- [DIỄN GIẢI...' hoặc '--- [NỘI DUNG...'
        """
        pattern = re.compile(
            r'(--- \[(?:DIỄN GIẢI|NỘI DUNG)[^\]]+\] ---\n.*?\n-{30,})',
            re.DOTALL
        )

        sections = []
        last_idx = 0

        for match in pattern.finditer(text):
            start, end = match.span()
            if start > last_idx:
                normal_part = text[last_idx:start]
                if normal_part.strip():
                    sections.append(("NORMAL", normal_part))

            diagram_part = match.group(1)
            sections.append(("DIAGRAM", diagram_part))
            last_idx = end

        if last_idx < len(text):
            remaining = text[last_idx:]
            if remaining.strip():
                sections.append(("NORMAL", remaining))

        return sections if sections else [("NORMAL", text)]

    @staticmethod
    def _extract_diagram_metadata(diagram_text: str) -> Tuple[Optional[str], Optional[int]]:
        """Bóc tách IMAGE_PATH và TRANG từ header của khối sơ đồ."""
        first_line = diagram_text.split("\n", 1)[0]
        img_path = None
        page_num = None

        # Tìm IMAGE_PATH: /path/to/img.png
        img_match = re.search(r'IMAGE_PATH:\s*([^\s\]]+)', first_line)
        if img_match:
            img_path = img_match.group(1).strip()

        # Tìm TRANG X
        page_match = re.search(r'TRANG\s+(\d+)', first_line, re.IGNORECASE)
        if page_match:
            try:
                page_num = int(page_match.group(1))
            except ValueError:
                pass

        return img_path, page_num

    @staticmethod
    def _split_sentences(text: str) -> List[str]:
        return re.split(r'(?<=[.!?\n])\s+', text)
