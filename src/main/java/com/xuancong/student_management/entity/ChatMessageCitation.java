package com.xuancong.student_management.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.util.UUID;

/**
 * Trích dẫn nguồn cho 1 câu trả lời AI.
 * chunkId trỏ sang point id tương ứng bên Qdrant (collection document_chunks).
 */
@Entity
@Table(name = "chat_message_citations")
@Getter
@Setter
@NoArgsConstructor
public class ChatMessageCitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileItem file;

    // Point id bên Qdrant — KHÔNG phải khóa ngoại DB, chỉ là tham chiếu logic sang vector store
    @Column(name = "chunk_id", nullable = false, length = 64)
    private String chunkId;

    @Column(name = "page_label", length = 50)
    private String pageLabel; // VD: "Trang 1-5"

    @Column
    private Float score; // độ tương đồng cosine trả về từ Qdrant
}
