package com.xuancong.student_management.dto.docs;

import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record DocumentSearchResult(
        Long id,
        String name,
        DocumentType type,
        DocumentStatus status,
        String snippet,
        Double score,
        Uploader uploader,
        LocalDateTime uploadedAt,
        List<SourceInfo> sources
) {
    public record SourceInfo(
            Long documentId,
            String chunkId,
            Integer chunkIndex,
            String content,
            Double score
    ) {
    }

    public record Uploader(
            String id,
            String name
    ) {
    }
}
