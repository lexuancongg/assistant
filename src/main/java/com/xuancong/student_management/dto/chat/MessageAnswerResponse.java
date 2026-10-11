package com.xuancong.student_management.dto.chat;

import java.util.List;

public record MessageAnswerResponse(
        String id,
        Long sessionId,
        String messageId,
        String answer,
        List<SourceCitationResponse> sources,
        String mode,
        String intent,
        Double groundednessScore,
        List<AgentTraceStepResponse> reasoningTrace
) {
    public MessageAnswerResponse(Long sessionId, String answer, List<SourceCitationResponse> sources) {
        this(null, sessionId, null, answer, sources, "STANDARD_RAG", null, null, null);
    }

    public MessageAnswerResponse(String id, Long sessionId, String answer, List<SourceCitationResponse> sources) {
        this(id, sessionId, null, answer, sources, "STANDARD_RAG", null, null, null);
    }

    public record SourceCitationResponse(
            Long documentId,
            String chunkId,
            Integer chunkIndex,
            String content,
            Double score
    ) {
    }

    public record AgentTraceStepResponse(
            String agentName,
            String action,
            String outputSummary,
            String status
    ) {
    }
}
