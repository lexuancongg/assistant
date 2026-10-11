package com.xuancong.student_management.dto.chat;

import com.xuancong.student_management.entity.enums.FeedbackRating;
import com.xuancong.student_management.entity.enums.FeedbackReason;

public record FeedbackRequestDto(
        FeedbackRating rating,
        FeedbackReason reason,
        String comment,
        String correctedAnswer
) {}
