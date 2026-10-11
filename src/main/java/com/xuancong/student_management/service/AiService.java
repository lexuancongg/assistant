package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.chat.RagRequest;
import com.xuancong.student_management.dto.chat.RagResponse;
import com.xuancong.student_management.dto.chat.SearchRequest;
import com.xuancong.student_management.dto.chat.SearchResponse;
import com.xuancong.student_management.dto.client.ExtractRequest;
import com.xuancong.student_management.dto.client.ExtractResponse;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.repository.FileItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final AIServiceClient aiServiceClient;
    private final FileItemRepository fileItemRepository;

    @Async
    @Transactional
    public void processAsync(Long fileId, String filePath) {
        try {
            long docNumericId = fileId != null ? fileId : 0L;
            if (filePath != null && !filePath.isBlank()) {
                ExtractRequest extractRequest = ExtractRequest.builder()
                        .documentId(docNumericId)
                        .filePath(filePath)
                        .build();

                ExtractResponse response = aiServiceClient.extract(extractRequest);
                log.info("AI extraction completed for file {}: confidence={}", fileId, response != null ? response.getConfidence() : 0);
            }

            fileItemRepository.findById(fileId).ifPresent(file -> {
                file.setAiIndexed(true);
                fileItemRepository.save(file);
                log.info("File marked as AI indexed: {}", fileId);
            });
        } catch (Exception e) {
            log.warn("AI extraction via Python service failed for file {}, marking indexed locally: {}", fileId, e.getMessage());
            fileItemRepository.findById(fileId).ifPresent(file -> {
                file.setAiIndexed(true);
                fileItemRepository.save(file);
            });
        }
    }

    public RagResponse ask(RagRequest ragRequest) {
        return this.aiServiceClient.ask(ragRequest);
    }

    public SearchResponse search(SearchRequest searchRequest) {
        return this.aiServiceClient.search(searchRequest);
    }

    public void deleteDocument(Long fileId) {
        if (fileId == null) return;
        try {
            this.aiServiceClient.deleteDocument(fileId);
        } catch (Exception e) {
            log.warn("Failed to delete vectors for document {}: {}", fileId, e.getMessage());
        }
    }
}
