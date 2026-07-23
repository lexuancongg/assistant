package com.xuancong.student_management.dto.chat;

import lombok.Builder;

@Builder
public record SearchRequest(
        String query,
        Long documentId,
        Integer topK
) {
}
