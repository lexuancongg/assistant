package com.xuancong.student_management.dto.chat;


import java.util.List;

public record RagResponse(
        String answer,
        List<SourceChunk> sources
) {
    public record SourceChunk(
            String chunkId,
            String content,
            Double score
    ) {
    }
}