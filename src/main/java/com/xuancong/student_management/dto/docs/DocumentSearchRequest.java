package com.xuancong.student_management.dto.docs;

import com.xuancong.student_management.enums.DocumentType;

public record DocumentSearchRequest(
        String query,
        DocumentType documentType,
        Long uploadedBy,
        Integer topK
) {
}
