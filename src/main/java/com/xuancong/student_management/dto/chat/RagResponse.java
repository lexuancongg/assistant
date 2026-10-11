package com.xuancong.student_management.dto.chat;

import java.util.List;

public record RagResponse(
        String answer,
        List<SourceChunk> sources,
        String mode,
        String intent,
        Double groundednessScore,
        List<AgentTraceStepResponse> reasoningTrace,
        Integer promptTokens,
        Integer completionTokens,
        Integer totalTokens
) {
    public record SourceChunk(
            String chunkId,
            String content,
            Double score,
            Object documentId,
            Integer chunkIndex
    ) {
        public Long getDocIdLong() {
            if (documentId == null) return null;
            if (documentId instanceof Number n) return n.longValue();
            try {
                return Long.parseLong(String.valueOf(documentId));
            } catch (Exception e) {
                return null;
            }
        }
    }

    public record AgentTraceStepResponse(
            String agentName,
            String action,
            String outputSummary,
            String status
    ) {
    }
}