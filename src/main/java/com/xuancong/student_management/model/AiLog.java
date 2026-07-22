package com.xuancong.student_management.model;


import com.xuancong.student_management.enums.AiAction;
import com.xuancong.student_management.enums.AiStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AiAction action;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @Column(name = "processing_time")
    private Long processingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AiStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
