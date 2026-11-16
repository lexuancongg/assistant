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
        current_sentences = []
        current_len = 0

        for sentence in sentences:
            s_clean = sentence.strip()
            if not s_clean:
                continue

            # Chiều dài dự kiến khi thêm câu mới (cộng thêm dấu cách nếu không phải câu đầu)
            added_len = len(s_clean) + (1 if current_sentences else 0)

            if current_len + added_len <= self.size:
                current_sentences.append(s_clean)
                current_len += added_len
            else:
                if current_sentences:
                    chunk_text = " ".join(current_sentences).strip()
                    if chunk_text:
                        chunks.append(chunk_text)

                # Overlap an toàn: lấy các câu cuối cùng có tổng chiều dài xấp xỉ self.overlap
                overlap_sentences = []
                overlap_accum = 0
                for s in reversed(current_sentences):
                    if overlap_accum + len(s) <= self.overlap or not overlap_sentences:
                        overlap_sentences.insert(0, s)
                        overlap_accum += len(s) + 1
                    else:
                        break

                current_sentences = overlap_sentences + [s_clean]
                current_len = sum(len(s) for s in current_sentences) + max(0, len(current_sentences) - 1)

        if current_sentences:
            final_text = " ".join(current_sentences).strip()
            if final_text:
                chunks.append(final_text)

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
        first_line = diagram_text.split("\n", 1)[0]
        img_path = None
        page_num = None

        img_match = re.search(r'IMAGE_PATH:\s*([^\s\]]+)', first_line)
        if img_match:
            img_path = img_match.group(1).strip()

        page_match = re.search(r'TRANG\s+(\d+)', first_line, re.IGNORECASE)
        if page_match:
            try:
                page_num = int(page_match.group(1))
            except ValueError:
                pass

        return img_path, page_num

    @staticmethod
    def _split_sentences(text: str) -> List[str]:
        # Tách câu thông minh: chỉ tách khi gặp dấu chấm/chấm than/chấm hỏi và theo sau là khoảng trắng + chữ hoa hoặc xuống dòng
        # Không ngắt nhầm các số dạng 1.850.000, 18.5%, Điều 1.2
        splits = re.split(r'(?<=[.!?])\s+(?=[A-ZÀ-Ỹ0-9])|\n+', text)
        return [s.strip() for s in splits if s and s.strip()]
