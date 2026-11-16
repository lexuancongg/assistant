package com.xuancong.student_management.dto.chat;

import lombok.Builder;
import java.time.Instant;

@Builder
public record ChatSessionSummaryResponse(
        String id,
        Long sessionId,
        String title,
        String assistantPersona,
        Boolean favorite,
        Long documentId,
        String documentName,
        Integer messageCount,
        Instant createdAt
) {
}
