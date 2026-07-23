package com.xuancong.student_management.dto.chat;

import java.util.List;

public record MessageAnswerResponse(
        Long sessionId,
        String answer,
        List<SourceCitationResponse> sources

) {
    public record SourceCitationResponse(
            Long documentId,
            String chunkId,
            Integer chunkIndex,
            String content,
            Double score
    ) {
    }
}
