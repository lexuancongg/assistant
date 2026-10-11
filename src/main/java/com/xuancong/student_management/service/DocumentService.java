package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.docs.DashboardStatsResponse;
import com.xuancong.student_management.dto.docs.DocumentDetailResponse;
import com.xuancong.student_management.dto.docs.DocumentPreviewResponse;
import com.xuancong.student_management.dto.docs.DocumentResponse;
import com.xuancong.student_management.dto.docs.DocumentSearchResult;
import com.xuancong.student_management.dto.paging.PageResponse;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.FolderRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final FileItemRepository fileItemRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final CompanyRepository companyRepository;
    private final S3FileService s3FileService;
    private final AiService aiService;

    public DocumentPreviewResponse upload(MultipartFile file, Long folderId) {
        String filePathS3;
        try {
            filePathS3 = s3FileService.uploadFile(file);
        } catch (Exception e) {
            log.error("Upload file to S3 failed: {}", e.getMessage(), e);
            throw new RuntimeException("Upload file to S3 failed", e);
        }

        User uploader = getAuthenticatedUser();
        if (uploader == null) {
            uploader = userRepository.findAll().stream().findFirst().orElse(null);
        }

        Company company = (uploader != null && uploader.getCompany() != null)
                ? uploader.getCompany()
                : companyRepository.findAll().stream().findFirst().orElse(null);

        FileItem fileItem = new FileItem();
        fileItem.setName(file.getOriginalFilename());
        fileItem.setFileType(extractExtension(file.getOriginalFilename()));
        fileItem.setSizeBytes(file.getSize());
        fileItem.setUploadedBy(uploader);
        fileItem.setCompany(company);

        if (folderId != null) {
            folderRepository.findById(folderId).ifPresent(fileItem::setFolder);
        }

        fileItem = fileItemRepository.save(fileItem);
        aiService.processAsync(fileItem.getId(), filePathS3);

        return DocumentPreviewResponse.builder()
                .id(fileItem.getId())
                .fileName(fileItem.getName())
                .documentType(DocumentType.OTHER)
                .status(DocumentStatus.PROCESSING)
                .uploadedAt(LocalDateTime.now())
                .build();
    }

    public DashboardStatsResponse getStats() {
        long total = fileItemRepository.count();
        long indexed = fileItemRepository.countByAiIndexedTrue();
        return new DashboardStatsResponse(
                new DashboardStatsResponse.Stat(total, 5.0),
                new DashboardStatsResponse.Stat(indexed, 2.0),
                new DashboardStatsResponse.Stat(0L, 0.0),
                new DashboardStatsResponse.Stat(0L, 0.0),
                new DashboardStatsResponse.Stat(total - indexed, 1.0)
        );
    }

    public PageResponse<DocumentResponse> getDocsPaging(int page, int size, String query, DocumentType type, DocumentStatus status, Long uploadedBy) {
        List<DocumentResponse> list = getDocs(query, type, status, uploadedBy);
        return PageResponse.<DocumentResponse>builder()
                .data(list)
                .totalElements((long) list.size())
                .totalPages(1)
                .isLast(true)
                .build();
    }

    public List<DocumentSearchResult> semanticSearch(String query, DocumentType type, Integer topK) {
        try {
            com.xuancong.student_management.dto.chat.SearchResponse searchResp = aiService.search(
                    com.xuancong.student_management.dto.chat.SearchRequest.builder()
                            .query(query)
                            .topK(topK != null ? topK : 10)
                            .build()
            );

            if (searchResp != null && searchResp.sources() != null) {
                return searchResp.sources().stream()
                        .map(s -> DocumentSearchResult.builder()
                                .id(s.documentId())
                                .name("Tài liệu trích dẫn")
                                .type(DocumentType.OTHER)
                                .status(DocumentStatus.PROCESSED)
                                .snippet(s.content())
                                .score(s.score())
                                .uploadedAt(LocalDateTime.now())
                                .sources(List.of(new DocumentSearchResult.SourceInfo(
                                        s.documentId(),
                                        s.chunkId(),
                                        s.chunkIndex(),
                                        s.content(),
                                        s.score()
                                )))
                                .build()
                        )
                        .toList();
            }
        } catch (Exception e) {
            log.warn("AI semantic search call failed: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    public List<DocumentResponse> getDocs(String query, DocumentType type, DocumentStatus status, Long uploadedBy) {
        return fileItemRepository.findByDeletedAtIsNull().stream()
                .map(DocumentResponse::fromFileItem)
                .toList();
    }

    public DocumentDetailResponse getDocDetail(Long id) {
        return new DocumentDetailResponse(
                id,
                "Tài liệu #" + id,
                DocumentType.OTHER,
                DocumentStatus.PROCESSED,
                0.95,
                false,
                new HashMap<>(),
                "Tóm tắt nội dung tài liệu doanh nghiệp",
                "Nội dung OCR trích xuất..."
        );
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private String extractExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        }
        return "pdf";
    }
}
