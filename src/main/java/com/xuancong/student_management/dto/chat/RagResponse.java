package com.xuancong.student_management.dto.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
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
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SourceChunk(
            String chunkId,
            String content,
            Double score,
            Object documentId,
            Integer chunkIndex,
            String imagePath,
            Boolean isVisual
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AgentTraceStepResponse(
            String agentName,
            String action,
            String outputSummary,
            String status
    ) {
    }
}
