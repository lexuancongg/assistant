package com.xuancong.student_management.dto.client;

import com.xuancong.student_management.enums.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
public class ExtractResponse {

    private DocumentType documentType;

    private String summary;

    private String ocrText;

    private Map<String, Object> metadata;
    private List<ChunkInfo> chunks;
    private Double confidence;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChunkInfo {
        private Integer chunkIndex;
        private String content;
        private String embeddingId;
    }

}