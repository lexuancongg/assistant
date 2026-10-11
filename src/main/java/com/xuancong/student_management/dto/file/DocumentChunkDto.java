package com.xuancong.student_management.dto.file;

import java.time.Instant;
import java.util.UUID;

public record DocumentChunkDto(
        Long id,
        Long fileId,
        String fileName,
        int chunkIndex,
        String pointId,
        String content,
        Integer tokenCount,
        Integer pageNumber,
        boolean isActive,
        Instant createdAt
) {}
