package com.xuancong.student_management.model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "embedding_id", length = 255)
    private String embeddingId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}