package com.xuancong.student_management.entity;

import com.xuancong.student_management.entity.enums.FeedbackRating;
import com.xuancong.student_management.entity.enums.FeedbackReason;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_message_feedbacks")
@Getter
@Setter
@NoArgsConstructor
public class ChatMessageFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private FeedbackRating rating;

    @Enumerated(EnumType.STRING)
    @Column(name = "feedback_reason", length = 50)
    private FeedbackReason feedbackReason;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "corrected_answer", columnDefinition = "TEXT")
    private String correctedAnswer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
