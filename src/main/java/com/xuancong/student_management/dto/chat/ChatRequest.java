package com.xuancong.student_management.dto.chat;

import java.util.List;

public record ChatRequest(
        String sessionId,
        String fileId,
        Long documentId,
        String question,
        String persona,
        List<ChatHistoryMessage> history,
        String mode,
        String modelProvider
) {
    public ChatRequest(String sessionId, Long documentId, String question, String persona, List<ChatHistoryMessage> history) {
        this(sessionId, null, documentId, question, persona, history, "STANDARD", "gemini");
    }

    public ChatRequest(String sessionId, Long documentId, String question, String persona, List<ChatHistoryMessage> history, String mode, String modelProvider) {
        this(sessionId, null, documentId, question, persona, history, mode, modelProvider);
    }

    public record ChatHistoryMessage(
            String role,
            String content
    ) {
    }
}
