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
        List<String> allowedDocumentIds,
        String folderName,
        List<String> subFolderNames,
        List<String> availableFiles,
        List<String> forbiddenFiles,
        String contextText
) {
    public record ChatHistoryMessage(
            String role,
            String content
    ) {
    }
}
