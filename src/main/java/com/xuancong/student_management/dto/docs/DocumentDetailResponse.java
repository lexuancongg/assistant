package com.xuancong.student_management.dto.docs;

import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;

import java.util.Map;

public record DocumentDetailResponse(
        Long id,
        String name,
        DocumentType type,
        DocumentStatus status,
        Double classificationConfidence,
        Boolean needsReview,
        Map<String, Object> extractedInfo,
        String aiSummary,
        String ocrText
) {
}