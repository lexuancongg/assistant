package com.xuancong.student_management.dto.chat;

import java.util.List;

public record ChatRequest(
        String sessionId,
        Long documentId,
        String question,
        String persona,
        List<ChatHistoryMessage> history
) {
    public record ChatHistoryMessage(
            String role,
            String content
    ) {
    }
}
