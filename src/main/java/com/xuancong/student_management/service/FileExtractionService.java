package com.xuancong.student_management.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xuancong.student_management.dto.client.ExtractRequest;
import com.xuancong.student_management.dto.client.ExtractResponse;
import com.xuancong.student_management.dto.file.FileExtractionResponse;
import com.xuancong.student_management.dto.file.FileExtractionUpdateRequest;
import com.xuancong.student_management.entity.FileExtraction;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.ActivityType;
import com.xuancong.student_management.repository.FileExtractionRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileExtractionService {

    private final FileExtractionRepository fileExtractionRepository;
    private final FileItemRepository fileItemRepository;
    private final UserRepository userRepository;
    private final AIServiceClient aiServiceClient;
    private final ActivityLogManagementService activityLogManagementService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_INSTANT;

    public FileExtractionResponse getExtraction(Long fileId) {
        return fileExtractionRepository.findTopByFile_IdOrderByUpdatedAtDesc(fileId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public FileExtractionResponse extract(Long fileId, boolean force) {
        FileItem file = fileItemRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tệp"));

        if (!force) {
            var existing = fileExtractionRepository.findTopByFile_IdOrderByUpdatedAtDesc(fileId);
            if (existing.isPresent()) {
                return toResponse(existing.get());
            }
        }

        User currentUser = getAuthenticatedUser();

        String storagePath = file.getStoragePath();
        if (storagePath == null || storagePath.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tệp không có đường dẫn lưu trữ hợp lệ để trích xuất");
        }

        try {
            ExtractRequest req = ExtractRequest.builder()
                    .documentId(fileId)
                    .filePath(storagePath)
                    .build();

            ExtractResponse res = aiServiceClient.extract(req);

            String docType = "OTHER";
            if (res != null && res.getDocumentType() != null) {
                docType = res.getDocumentType().name();
            }

            String summary = res != null ? res.getSummary() : "";
            Double confidence = res != null && res.getConfidence() != null ? res.getConfidence() : 0.95;
            Map<String, Object> metadata = res != null && res.getMetadata() != null ? res.getMetadata() : new HashMap<>();

            String metadataJson = objectMapper.writeValueAsString(metadata);

            FileExtraction extraction = fileExtractionRepository.findTopByFile_IdOrderByUpdatedAtDesc(fileId)
                    .orElseGet(() -> {
                        FileExtraction fe = new FileExtraction();
                        fe.setFile(file);
                        return fe;
                    });

            extraction.setDocumentType(docType);
            extraction.setSummary(summary);
            extraction.setConfidence(confidence);
            extraction.setMetadataJson(metadataJson);
            extraction.setExtractedBy(currentUser != null ? currentUser : file.getUploadedBy());
            extraction.setUpdatedAt(Instant.now());

            FileExtraction saved = fileExtractionRepository.save(extraction);

            activityLogManagementService.logActivity(
                    file.getCompany(),
                    currentUser != null ? currentUser : file.getUploadedBy(),
                    ActivityType.UPDATE,
                    file,
                    Map.of(
                            "action", "EXTRACT_METADATA",
                            "documentType", docType,
                            "fileName", file.getName()
                    )
            );

            log.info("Successfully extracted data for file {}: type={}, confidence={}", fileId, docType, confidence);
            return toResponse(saved);
        } catch (Exception e) {
            log.error("Failed to extract data for file {}: {}", fileId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi trích xuất dữ liệu: " + e.getMessage());
        }
    }

    @Transactional
    public FileExtractionResponse update(Long fileId, FileExtractionUpdateRequest req) {
        FileItem file = fileItemRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tệp"));

        FileExtraction extraction = fileExtractionRepository.findTopByFile_IdOrderByUpdatedAtDesc(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có dữ liệu trích xuất cho tệp"));

        User currentUser = getAuthenticatedUser();

        if (req.getDocumentType() != null && !req.getDocumentType().isBlank()) {
            extraction.setDocumentType(req.getDocumentType().trim().toUpperCase());
        }
        if (req.getSummary() != null) {
            extraction.setSummary(req.getSummary().trim());
        }
        if (req.getMetadata() != null) {
            try {
                extraction.setMetadataJson(objectMapper.writeValueAsString(req.getMetadata()));
            } catch (Exception e) {
                log.warn("Cannot serialize updated metadata: {}", e.getMessage());
            }
        }

        extraction.setExtractedBy(currentUser != null ? currentUser : extraction.getExtractedBy());
        extraction.setUpdatedAt(Instant.now());

        FileExtraction saved = fileExtractionRepository.save(extraction);
        return toResponse(saved);
    }

    private FileExtractionResponse toResponse(FileExtraction fe) {
        Map<String, Object> meta = new HashMap<>();
        if (fe.getMetadataJson() != null && !fe.getMetadataJson().isBlank()) {
            try {
                meta = objectMapper.readValue(fe.getMetadataJson(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Cannot parse metadataJson for extraction {}: {}", fe.getId(), e.getMessage());
            }
        }

        String extractedByName = fe.getExtractedBy() != null ? fe.getExtractedBy().getName() : "AI Assistant";

        return new FileExtractionResponse(
                fe.getId(),
                fe.getFile().getId(),
                fe.getFile().getName(),
                fe.getDocumentType(),
                fe.getSummary(),
                fe.getConfidence(),
                meta,
                extractedByName,
                fe.getCreatedAt() != null ? FMT.format(fe.getCreatedAt()) : null,
                fe.getUpdatedAt() != null ? FMT.format(fe.getUpdatedAt()) : null
        );
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            String email = authentication.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }
}
