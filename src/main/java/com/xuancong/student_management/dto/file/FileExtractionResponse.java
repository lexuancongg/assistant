package com.xuancong.student_management.dto.file;

import java.util.Map;

public record FileExtractionResponse(
        Long id,
        Long fileId,
        String fileName,
        String documentType,
        String summary,
        Double confidence,
        Map<String, Object> metadata,
        String extractedByName,
        String createdAt,
        String updatedAt
) {}
