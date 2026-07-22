package com.xuancong.student_management.model;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "chat_citations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatCitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Assistant question
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    /**
     * Chunk được AI dùng để trả lời
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chunk_id", nullable = false)
    private DocumentChunk chunk;

    /**
     * Similarity score khi retrieve
     */
    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "rank_order")
    private Integer rankOrder;
}