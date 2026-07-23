package com.xuancong.student_management.dto.chat;

import lombok.Builder;

import java.util.List;

@Builder
public record SearchResponse(
        List<SourceChunk> sources
) {
    public record SourceChunk(
            String chunkId,
            String content,
            Double score,
            Long documentId,
            Integer chunkIndex
    ) {
    }
}
