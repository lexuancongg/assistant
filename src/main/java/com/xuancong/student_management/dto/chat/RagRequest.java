package com.xuancong.student_management.dto.chat;

import lombok.Builder;

import java.util.List;

@Builder
public record RagRequest(
        Long documentId,
        String question,
        List<ChatHistoryMessage> history,
        String mode,
        String modelProvider,
        List<String> allowedDocumentIds
) {
    public record ChatHistoryMessage(
            String role,
            String content
    ) {
    }
}
