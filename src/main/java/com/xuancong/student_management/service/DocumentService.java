package com.xuancong.student_management.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xuancong.student_management.dto.docs.DashboardStatsResponse;
import com.xuancong.student_management.dto.docs.DocumentDetailResponse;
import com.xuancong.student_management.dto.docs.DocumentPreviewResponse;
import com.xuancong.student_management.dto.docs.DocumentResponse;
import com.xuancong.student_management.dto.paging.PageResponse;
import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.model.Contract;
import com.xuancong.student_management.model.Document;
import com.xuancong.student_management.model.Email;
import com.xuancong.student_management.model.Invoice;
import com.xuancong.student_management.repository.ContractRepository;
import com.xuancong.student_management.repository.DocumentRepository;
import com.xuancong.student_management.repository.EmailRepository;
import com.xuancong.student_management.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private  final ObjectMapper objectMapper;
    private final S3FileService s3FileService;
    private final AiService aiService;

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

    public PageResponse<DocumentResponse> getDocsPaging(){
        List<DocumentResponse> datas = this.documentRepository.findAll()
                .stream()
                .map(DocumentResponse::fromDocument)
                .toList();
        return PageResponse.<DocumentResponse>builder()
                .totalPages(10)
                .totalElements(100)
                .data(datas)
                .isLast(false)
                .build();

    }

    public List<DocumentResponse> getDocs(){
        return this.documentRepository.findAll()
                .stream()
                .map(DocumentResponse::fromDocument)
                .toList();
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