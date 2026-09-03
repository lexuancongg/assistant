package com.xuancong.student_management.dto.chat;

import java.util.List;

public record MessageAnswerResponse(
        String id,
        Long sessionId,
        String answer,
        List<SourceCitationResponse> sources

) {
    public MessageAnswerResponse(Long sessionId, String answer, List<SourceCitationResponse> sources) {
        this(null, sessionId, answer, sources);
    }

    public record SourceCitationResponse(
            Long documentId,
            String chunkId,
            Integer chunkIndex,
            String content,
            Double score
    ) {
    }
}
