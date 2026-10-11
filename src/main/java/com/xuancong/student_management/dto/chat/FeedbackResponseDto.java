package com.xuancong.student_management.dto.chat;

import com.xuancong.student_management.entity.enums.FeedbackRating;
import com.xuancong.student_management.entity.enums.FeedbackReason;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponseDto(
        Long id,
        Long messageId,
        Long userId,
        String userName,
        FeedbackRating rating,
        FeedbackReason reason,
        String comment,
        String correctedAnswer,
        Instant createdAt
) {}
