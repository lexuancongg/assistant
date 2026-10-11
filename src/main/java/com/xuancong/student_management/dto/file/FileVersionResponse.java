package com.xuancong.student_management.dto.file;

import java.util.UUID;

public record FileVersionResponse(
        Long id,
        Long fileId,
        Integer versionNo,
        String storagePath,
        Long sizeBytes,
        String sizeFormatted,
        String uploadedByName,
        String uploadedByEmail,
        String createdAt,
        boolean isCurrent
) {}
