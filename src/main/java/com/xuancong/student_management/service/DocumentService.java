package com.xuancong.student_management.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xuancong.student_management.dto.docs.DashboardStatsResponse;
import com.xuancong.student_management.dto.docs.DocumentDetailResponse;
import com.xuancong.student_management.dto.docs.DocumentPreviewResponse;
import com.xuancong.student_management.dto.docs.DocumentResponse;
import com.xuancong.student_management.dto.docs.DocumentSearchResult;
import com.xuancong.student_management.dto.paging.PageResponse;
import com.xuancong.student_management.dto.chat.SearchRequest;
import com.xuancong.student_management.dto.chat.SearchResponse;
import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;
import com.xuancong.student_management.model.Contract;
import com.xuancong.student_management.model.Document;
import com.xuancong.student_management.model.Email;
import com.xuancong.student_management.model.Invoice;
import com.xuancong.student_management.model.User;
import com.xuancong.student_management.repository.ContractRepository;
import com.xuancong.student_management.repository.DocumentRepository;
import com.xuancong.student_management.repository.EmailRepository;
import com.xuancong.student_management.repository.InvoiceRepository;
import com.xuancong.student_management.repository.UserRepository;
import com.xuancong.student_management.service.AIServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final EmailRepository emailRepository;
    private final ContractRepository contractRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final S3FileService s3FileService;
    private final AiService aiService;
    private final AIServiceClient aiServiceClient;

    public DocumentPreviewResponse upload(MultipartFile file) {
        String filePathS3;
        try {
            filePathS3 = s3FileService.uploadFile(file);
        } catch (Exception e) {
            log.error("Upload file to S3 failed: {}", e.getMessage(), e);
            throw new RuntimeException("Upload file to S3 failed", e);
        }

        Document document = Document.builder()
                .documentName(file.getOriginalFilename())
                .filePath(filePathS3)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .status(DocumentStatus.PROCESSING)
                .uploadedBy(getAuthenticatedUser().getId())
                .uploadedAt(LocalDateTime.now())
                .build();

        document = documentRepository.save(document);

        // Xử lý AI bất đồng bộ, không block request upload
        aiService.processAsync(document.getId());

        return DocumentPreviewResponse.builder()
                .id(document.getId())
                .fileName(document.getDocumentName())
                .documentType(document.getDocumentType())
                .status(document.getStatus())
                .uploadedAt(document.getUploadedAt())
                .build();
    }


    public DashboardStatsResponse getStats() {

        ZonedDateTime now = ZonedDateTime.now();

        ZonedDateTime currentMonthStart = now
                .withDayOfMonth(1)
                .toLocalDate()
                .atStartOfDay(now.getZone());

        ZonedDateTime nextMonthStart = currentMonthStart.plusMonths(1);

        ZonedDateTime previousMonthStart = currentMonthStart.minusMonths(1);

        long total = documentRepository.count();
        long contracts = contractRepository.count();
        long invoices = invoiceRepository.count();
        long emails = emailRepository.count();
        long others = total - contracts - invoices - emails;

        return new DashboardStatsResponse(
                buildStat(
                        total,
                        documentRepository.countByCreatedAtBetween(currentMonthStart, nextMonthStart),
                        documentRepository.countByCreatedAtBetween(previousMonthStart, currentMonthStart)
                ),
                buildStat(
                        contracts,
                        contractRepository.countByCreatedAtBetween(currentMonthStart, nextMonthStart),
                        contractRepository.countByCreatedAtBetween(previousMonthStart, currentMonthStart)
                ),
                buildStat(
                        invoices,
                        invoiceRepository.countByCreatedAtBetween(currentMonthStart, nextMonthStart),
                        invoiceRepository.countByCreatedAtBetween(previousMonthStart, currentMonthStart)
                ),
                buildStat(
                        emails,
                        emailRepository.countByCreatedAtBetween(currentMonthStart, nextMonthStart),
                        emailRepository.countByCreatedAtBetween(previousMonthStart, currentMonthStart)
                ),
                buildStat(
                        others,
                        calculateOtherCurrentMonth(currentMonthStart, nextMonthStart),
                        calculateOtherPreviousMonth(previousMonthStart, currentMonthStart)
                )
        );
    }


    private DashboardStatsResponse.Stat buildStat(
            long total,
            long currentMonth,
            long previousMonth
    ) {

        return new DashboardStatsResponse.Stat(
                total,
                calculateGrowth(currentMonth, previousMonth)
        );
    }


    private double calculateGrowth(long current, long previous) {

        if (previous == 0) {
            return current == 0 ? 0 : 100;
        }

        double growth = ((double) (current - previous) / previous) * 100;

        return Math.round(growth * 10.0) / 10.0;
    }

    private long calculateOtherCurrentMonth(
            ZonedDateTime start,
            ZonedDateTime end
    ) {
        return documentRepository.countByCreatedAtBetween(start, end)
                - contractRepository.countByCreatedAtBetween(start, end)
                - invoiceRepository.countByCreatedAtBetween(start, end)
                - emailRepository.countByCreatedAtBetween(start, end);
    }

    private long calculateOtherPreviousMonth(
            ZonedDateTime start,
            ZonedDateTime end
    ) {
        return documentRepository.countByCreatedAtBetween(start, end)
                - contractRepository.countByCreatedAtBetween(start, end)
                - invoiceRepository.countByCreatedAtBetween(start, end)
                - emailRepository.countByCreatedAtBetween(start, end);
    }

    public PageResponse<DocumentResponse> getDocsPaging(int page, int size, String query, DocumentType type, DocumentStatus status, Long uploadedBy){
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);

        Specification<Document> spec = buildDocumentSpecification(query, type, status, uploadedBy);
        Page<Document> documentPage = spec == null
                ? this.documentRepository.findAll(PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")))
                : this.documentRepository.findAll(spec, PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));

        return PageResponse.<DocumentResponse>builder()
                .totalPages(documentPage.getTotalPages())
                .totalElements(documentPage.getTotalElements())
                .data(documentPage.stream().map(DocumentResponse::fromDocument).toList())
                .isLast(documentPage.isLast())
                .build();
    }

    public List<DocumentResponse> getDocs(String query, DocumentType type, DocumentStatus status, Long uploadedBy){
        Specification<Document> spec = buildDocumentSpecification(query, type, status, uploadedBy);
        List<Document> documents = spec == null
                ? this.documentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                : this.documentRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));

        return documents.stream()
                .map(DocumentResponse::fromDocument)
                .toList();
    }

    private Specification<Document> buildDocumentSpecification(String query, DocumentType type, DocumentStatus status, Long uploadedBy) {
        Specification<Document> spec = null;

        if (query != null && !query.isBlank()) {
            String search = "%" + query.trim().toLowerCase() + "%";
            Specification<Document> querySpec = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("documentName")), search),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("summary")), search)
            );
            spec = spec == null ? querySpec : spec.and(querySpec);
        }

        if (type != null) {
            Specification<Document> typeSpec = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.equal(root.get("documentType"), type);
            spec = spec == null ? typeSpec : spec.and(typeSpec);
        }

        if (status != null) {
            Specification<Document> statusSpec = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.equal(root.get("status"), status);
            spec = spec == null ? statusSpec : spec.and(statusSpec);
        }

        if (uploadedBy != null) {
            Specification<Document> uploaderSpec = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.equal(root.get("uploadedBy"), uploadedBy);
            spec = spec == null ? uploaderSpec : spec.and(uploaderSpec);
        }

        return spec;
    }

    public List<DocumentSearchResult> semanticSearch(String query, DocumentType documentType, Integer topK) {
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("query is required for semantic search");
        }

        SearchResponse searchResponse = aiServiceClient.search(
                SearchRequest.builder()
                        .query(query)
                        .topK(topK != null && topK > 0 ? topK : 10)
                        .build()
        );

        return searchResponse.sources().stream()
                .filter(source -> source.documentId() != null)
                .collect(java.util.stream.Collectors.groupingBy(SearchResponse.SourceChunk::documentId))
                .entrySet().stream()
                .map(entry -> {
                    Long documentId = entry.getKey();
                    return documentRepository.findById(documentId)
                            .filter(doc -> documentType == null || documentType == doc.getDocumentType())
                            .map(document -> {
                                List<DocumentSearchResult.SourceInfo> sources = entry.getValue().stream()
                                        .map(source -> new DocumentSearchResult.SourceInfo(
                                                source.documentId(),
                                                source.chunkId(),
                                                source.chunkIndex(),
                                                source.content(),
                                                source.score()
                                        ))
                                        .toList();
                                double bestScore = sources.stream()
                                        .mapToDouble(DocumentSearchResult.SourceInfo::score)
                                        .max()
                                        .orElse(0.0);
                                String uploaderId = document.getUploadedBy() != null ? document.getUploadedBy().toString() : "0";
                                String uploaderName = document.getUploadedBy() != null
                                        ? userRepository.findById(document.getUploadedBy())
                                        .map(User::getUsername)
                                        .orElse("uploaded-user-" + document.getUploadedBy())
                                        : "system";
                                DocumentSearchResult.Uploader uploader = new DocumentSearchResult.Uploader(
                                        uploaderId,
                                        uploaderName
                                );
                                String snippet = sources.stream()
                                        .map(DocumentSearchResult.SourceInfo::content)
                                        .filter(text -> text != null && !text.isBlank())
                                        .findFirst()
                                        .orElse(document.getSummary());

                                return DocumentSearchResult.builder()
                                        .id(document.getId())
                                        .name(document.getDocumentName())
                                        .type(document.getDocumentType())
                                        .status(document.getStatus())
                                        .snippet(snippet)
                                        .score(bestScore)
                                        .uploader(uploader)
                                        .uploadedAt(document.getUploadedAt())
                                        .sources(sources)
                                        .build();
                            })
                            .orElse(null);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new RuntimeException("User is not authenticated");
        }
        return userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }

    @Transactional(readOnly = true)
    public DocumentDetailResponse getDocDetail(long id) {

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

        Map<String, Object> extractedInfo = new LinkedHashMap<>();

        switch (document.getDocumentType()) {

            case CONTRACT -> {
                Contract contract = contractRepository
                        .findByDocumentId(document.getId())
                        .orElseThrow(() -> new RuntimeException("Contract not found for document id: " + document.getId()));

                extractedInfo.put("contractNumber", contract.getContractNumber());
                extractedInfo.put("contractType", contract.getContractType());

                extractedInfo.put("partyA", contract.getPartyA());
                extractedInfo.put("partyB", contract.getPartyB());
                extractedInfo.put("partyARepresentative", contract.getPartyARepresentative());
                extractedInfo.put("partyBRepresentative", contract.getPartyBRepresentative());

                extractedInfo.put("signedDate", contract.getSignedDate());
                extractedInfo.put("startDate", contract.getStartDate());
                extractedInfo.put("endDate", contract.getEndDate());
                extractedInfo.put("durationMonths", contract.getDurationMonths());
                extractedInfo.put("autoRenew", contract.getAutoRenew());
                extractedInfo.put("noticeDays", contract.getNoticeDays());

                extractedInfo.put("recurringAmount", contract.getRecurringAmount());
                extractedInfo.put("recurringPeriod", contract.getRecurringPeriod());
                extractedInfo.put("deposit", contract.getDeposit());
                extractedInfo.put("totalContractValue", contract.getTotalContractValue());
                extractedInfo.put("currency", contract.getCurrency());
                extractedInfo.put("paymentTerms", contract.getPaymentTerms());

                extractedInfo.put("status", contract.getStatus());
                extractedInfo.put("needsReview", contract.getNeedsReview());
                extractedInfo.put("extractionConfidence", contract.getExtractionConfidence());
                extractedInfo.put("riskScore", contract.getRiskScore());

                extractedInfo.put(
                        "additionalFees",
                        contract.getAdditionalFees().stream()
                                .map(fee -> Map.of(
                                        "name", fee.getName() == null ? "" : fee.getName(),
                                        "amount", fee.getAmount(),
                                        "period", fee.getPeriod()
                                ))
                                .toList()
                );
            }

            case INVOICE -> {
                Invoice invoice = invoiceRepository
                        .findByDocumentId(document.getId())
                        .orElseThrow(() -> new RuntimeException("Invoice not found for document id: " + document.getId()));

                extractedInfo.put("invoiceNumber", invoice.getInvoiceNumber());
                extractedInfo.put("supplier", invoice.getSupplier());
                extractedInfo.put("taxCode", invoice.getTaxCode());
                extractedInfo.put("invoiceDate", invoice.getInvoiceDate());
                extractedInfo.put("dueDate", invoice.getDueDate());
                extractedInfo.put("amount", invoice.getAmount());
                extractedInfo.put("vat", invoice.getVat());
                extractedInfo.put("totalAmount", invoice.getTotalAmount());
                extractedInfo.put("currency", invoice.getCurrency());
                extractedInfo.put("status", invoice.getStatus());
            }

            case EMAIL -> {
                Email email = emailRepository
                        .findByDocumentId(document.getId())
                        .orElseThrow(() -> new RuntimeException("Email not found for document id: " + document.getId()));

                extractedInfo.put("sender", email.getSender());
                extractedInfo.put("receiver", email.getReceiver());
                extractedInfo.put("subject", email.getSubject());
                extractedInfo.put("body", email.getBody());
                extractedInfo.put("hasAttachment", email.getHasAttachment());
                extractedInfo.put("attachmentCount", email.getAttachmentCount());
                extractedInfo.put("category", email.getCategory());
                extractedInfo.put("priority", email.getPriority());
                extractedInfo.put("sentAt", email.getSentAt());
                extractedInfo.put("receivedAt", email.getReceivedAt());
            }

            default -> {
            }
        }

        return new DocumentDetailResponse(
                document.getId(),
                document.getDocumentName(),
                document.getDocumentType(),
                document.getStatus(),
                document.getClassificationConfidence(), // <-- confidence ở cấp Document, lấy từ processAsync đã sửa
                document.getNeedsReview(),
                extractedInfo,
                document.getSummary(),
                document.getOcrText()
        );
    }
}