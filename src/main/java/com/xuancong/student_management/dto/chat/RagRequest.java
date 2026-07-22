package com.xuancong.student_management.dto.chat;

import lombok.Builder;

@Builder
public record RagRequest(
        Long documentId,
        String question
) {
}
