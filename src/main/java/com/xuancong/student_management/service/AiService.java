package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.chat.RagRequest;
import com.xuancong.student_management.dto.chat.RagResponse;
import com.xuancong.student_management.dto.client.ExtractRequest;
import com.xuancong.student_management.dto.client.ExtractResponse;
import com.xuancong.student_management.enums.*;
import com.xuancong.student_management.model.*;
import com.xuancong.student_management.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final AIServiceClient aiServiceClient;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final DocumentMetaDataRepository documentMetadataRepository;
    private final InvoiceRepository invoiceRepository;
    private final ContractRepository contractRepository;
    private final EmailRepository emailRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Async
    @Transactional
    public void processAsync(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        try {
            ExtractResponse response = aiServiceClient.extract(
                    ExtractRequest.builder()
                            .documentId(document.getId())
                            .filePath(document.getFilePath())
                            .build()
            );

            Double aiConfidence = normalizeConfidence(response.getConfidence());

            document.setDocumentType(response.getDocumentType());
            document.setSummary(response.getSummary());
            document.setOcrText(response.getOcrText());
            document.setClassificationConfidence(aiConfidence); // <-- dùng giá trị thật, không hardcode nữa
            document.setStatus(DocumentStatus.PROCESSED);
            documentRepository.save(document);

            saveChunks(document, response.getChunks());
            saveMetadata(document, response.getMetadata());
            mapToBusinessEntity(document, response.getDocumentType(), response.getMetadata(), aiConfidence);

            syncDocumentReviewStatus(document);

        } catch (Exception e) {
            log.error("AI extract failed for document {}: {}", documentId, e.getMessage(), e);
            document.setStatus(DocumentStatus.FAILED);
            documentRepository.save(document);
        }
    }

    // Chặn confidence lệch khoảng 0-1 phòng AI trả sai (giống bên Python đã làm)
    private Double normalizeConfidence(Double confidence) {
        if (confidence == null) return 0.0;
        return Math.max(0.0, Math.min(1.0, confidence));
    }


    private void syncDocumentReviewStatus(Document document) {
        DocumentType type = document.getDocumentType();

        boolean needsReview;

        if (type == null || type == DocumentType.OTHER) {
            needsReview = true;
        } else {
            needsReview = switch (type) {
                case CONTRACT -> contractRepository.findByDocumentId(document.getId())
                        .map(c -> Boolean.TRUE.equals(c.getNeedsReview()))
                        .orElse(true);
                case INVOICE -> invoiceRepository.findByDocumentId(document.getId())
                        .map(i -> i.getInvoiceNumber() == null)
                        .orElse(true);
                default -> false;
            };
        }

        // Confidence không còn bị suy ngược từ needsReview nữa —
        // nó đã được set thẳng từ response.getConfidence() ở processAsync().
        // Nhưng vẫn có thể ép needsReview=true nếu confidence quá thấp,
        // kể cả khi field bắt buộc không thiếu (AI tự thấy không chắc).
        if (document.getClassificationConfidence() != null
                && document.getClassificationConfidence() < 0.6) {
            needsReview = true;
        }

        document.setNeedsReview(needsReview);
        documentRepository.save(document);
    }
    private void mapToBusinessEntity(Document document, DocumentType documentType,
                                     Map<String, Object> metadata, Double confidence) {
        if (documentType == null || metadata == null || metadata.isEmpty()) {
            log.warn("Skip mapping business entity: documentType/metadata empty for document {}", document.getId());
            return;
        }

        try {
            switch (documentType) {
                case INVOICE -> mapInvoice(document, metadata, confidence);
                case CONTRACT -> mapContract(document, metadata, confidence);
                case EMAIL -> mapEmail(document, metadata);
                default -> log.info("DocumentType '{}' has no business mapping, skip.", documentType);
            }
        } catch (Exception e) {
            log.error("Failed to map business entity for document {} (type={}): {}",
                    document.getId(), documentType, e.getMessage(), e);
        }
    }

    // ===== CONTRACT =====
    private void mapContract(Document document, Map<String, Object> metadata, Double confidence) {
        Contract.ContractBuilder builder = Contract.builder()
                .document(document)
                .contractNumber(getString(metadata, "contractNumber"))
                .contractType(getEnum(metadata, "contractType", ContractType.class))
                .partyA(getString(metadata, "partyA"))
                .partyB(getString(metadata, "partyB"))
                .startDate(getLocalDate(metadata, "startDate"))
                .endDate(getLocalDate(metadata, "endDate"))
                .durationMonths(getInteger(metadata, "durationMonths"))
                .recurringAmount(getBigDecimal(metadata, "recurringAmount"))
                .recurringPeriod(getEnum(metadata, "recurringPeriod", FeePeriod.class))
                .deposit(getBigDecimal(metadata, "deposit"))
                .totalContractValue(getBigDecimal(metadata, "totalContractValue"))
                .currency(getString(metadata, "currency"))
                .paymentTerms(getString(metadata, "paymentTerms"))
                .extractionConfidence(confidence); // <-- field có sẵn trong entity, giờ mới được set

        Contract contract = builder.build();

        mapAdditionalFees(contract, metadata);

        if (contract.getTotalContractValue() == null) {
            contract.setTotalContractValue(calculateTotalContractValue(contract));
        }

        contract.setNeedsReview(isMissingCriticalFields(contract));

        if (contract.getContractNumber() == null) {
            log.warn("Contract missing contractNumber for document {}, saved with needsReview=true", document.getId());
        }

        contractRepository.save(contract);
    }

    // ===== INVOICE =====
    private void mapInvoice(Document document, Map<String, Object> metadata, Double confidence) {
        Invoice.InvoiceBuilder builder = Invoice.builder()
                .document(document)
                .invoiceNumber(getString(metadata, "invoiceNumber"))
                .supplier(getString(metadata, "supplier"))
                .taxCode(getString(metadata, "taxCode"))
                .invoiceDate(getLocalDate(metadata, "invoiceDate"))
                .dueDate(getLocalDate(metadata, "dueDate"))
                .amount(getBigDecimal(metadata, "amount"))
                .vat(getBigDecimal(metadata, "vat"))
                .totalAmount(getBigDecimal(metadata, "totalAmount"))
                .currency(getString(metadata, "currency"));

        InvoiceStatus status = getEnum(metadata, "status", InvoiceStatus.class);
        if (status != null) {
            builder.status(status);
        }

        Invoice invoice = builder.build();

        if (invoice.getInvoiceNumber() == null) {
            log.warn("Invoice missing invoiceNumber for document {}, skip save", document.getId());
            return;
        }

        invoiceRepository.save(invoice);
    }



    private boolean isMissingCriticalFields(Contract contract) {
        return contract.getContractNumber() == null
                || contract.getContractType() == null
                || contract.getStartDate() == null
                || (contract.getRecurringAmount() == null && contract.getTotalContractValue() == null);
    }


    @SuppressWarnings("unchecked")
    private void mapAdditionalFees(Contract contract, Map<String, Object> metadata) {
        Object raw = metadata.get("additionalFees");
        if (!(raw instanceof List<?> rawList)) {
            return;
        }

        for (Object item : rawList) {
            if (!(item instanceof Map<?, ?> feeMap)) {
                log.warn("Invalid additionalFees item for contract {}, skip: {}", contract.getContractNumber(), item);
                continue;
            }

            Map<String, Object> fee = (Map<String, Object>) feeMap;
            BigDecimal amount = getBigDecimal(fee, "amount");
            FeePeriod period = getEnum(fee, "period", FeePeriod.class);
            String name = getString(fee, "name");

            if (amount == null || period == null) {
                log.warn("Skip additionalFee missing amount/period for contract {}: {}", contract.getContractNumber(), fee);
                continue;
            }

            contract.addFee(ContractFee.builder()
                    .name(name)
                    .amount(amount)
                    .period(period)
                    .build());
        }
    }

    private BigDecimal calculateTotalContractValue(Contract contract) {
        boolean hasRecurring = contract.getRecurringAmount() != null && contract.getRecurringPeriod() != null;
        boolean hasFees = !contract.getAdditionalFees().isEmpty();

        // Không có khoản nào để tính -> null, không phải 0
        if (!hasRecurring && !hasFees) {
            return null;
        }

        Integer duration = contract.getDurationMonths();

        // Có khoản cần tính theo thời gian nhưng thiếu duration -> không đủ dữ liệu, để null
        if (duration == null) {
            log.warn("Cannot calculate totalContractValue for contract {}: missing durationMonths",
                    contract.getContractNumber());
            return null;
        }

        BigDecimal total = BigDecimal.ZERO;

        if (hasRecurring) {
            total = total.add(
                    contract.getRecurringAmount()
                            .multiply(BigDecimal.valueOf(periodsFor(contract.getRecurringPeriod(), duration)))
            );
        }

        for (ContractFee fee : contract.getAdditionalFees()) {
            int periods = periodsFor(fee.getPeriod(), duration);
            total = total.add(fee.getAmount().multiply(BigDecimal.valueOf(periods)));
        }

        // Không cộng deposit — vì được hoàn trả, không phải chi phí thực

        return total;
    }

    private int periodsFor(FeePeriod period, int durationMonths) {
        return switch (period) {
            case MONTHLY -> durationMonths;
            case QUARTERLY -> durationMonths / 3;
            case YEARLY -> durationMonths / 12;
            case ONE_TIME -> 1;
        };
    }

    // ===== EMAIL =====
    private void mapEmail(Document document, Map<String, Object> metadata) {
        Email.EmailBuilder builder = Email.builder()
                .document(document)
                .sender(getString(metadata, "sender"))
                .receiver(getString(metadata, "receiver"))
                .subject(getString(metadata, "subject"))
                .body(getString(metadata, "body"))
                .hasAttachment(getBoolean(metadata, "hasAttachment"))
                .attachmentCount(getInteger(metadata, "attachmentCount"))
                .sentAt(getLocalDateTime(metadata, "sentAt"))
                .receivedAt(getLocalDateTime(metadata, "receivedAt"));

        EmailCategory category = getEnum(metadata, "category", EmailCategory.class);
        if (category != null) {
            builder.category(category);
        }

        EmailPriority priority = getEnum(metadata, "priority", EmailPriority.class);
        if (priority != null) {
            builder.priority(priority);
        }

        emailRepository.save(builder.build());
    }
    // ===== Helper ép kiểu an toàn từ Map<String, Object> =====

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? String.valueOf(value).trim() : null;
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            if (value instanceof Number num) {
                return BigDecimal.valueOf(num.doubleValue());
            }
            String cleaned = value.toString().replaceAll("[^0-9.\\-]", "");
            return cleaned.isEmpty() ? null : new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            log.warn("Cannot parse BigDecimal for key '{}', value '{}'", key, value);
            return null;
        }
    }

    private LocalDate getLocalDate(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            return LocalDate.parse(value.toString(), DATE_FORMAT);
        } catch (Exception e) {
            log.warn("Cannot parse LocalDate for key '{}', value '{}'", key, value);
            return null;
        }
    }

    private LocalDateTime getLocalDateTime(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            return LocalDateTime.parse(value.toString());
        } catch (Exception e) {
            log.warn("Cannot parse LocalDateTime for key '{}', value '{}'", key, value);
            return null;
        }
    }

    private <T extends Enum<T>> T getEnum(Map<String, Object> map, String key, Class<T> enumClass) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            return Enum.valueOf(enumClass, value.toString().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Cannot parse enum {} for key '{}', value '{}'", enumClass.getSimpleName(), key, value);
            return null;
        }
    }
    private Boolean getBoolean(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Boolean b) return b;
        return Boolean.parseBoolean(value.toString().trim());
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        try {
            if (value instanceof Number num) {
                return num.intValue();
            }
            String cleaned = value.toString().replaceAll("[^0-9\\-]", "");
            return cleaned.isEmpty() ? null : Integer.parseInt(cleaned);
        } catch (NumberFormatException e) {
            log.warn("Cannot parse Integer for key '{}', value '{}'", key, value);
            return null;
        }
    }

    // ===== Chunks & Metadata =====

    private void saveChunks(Document document, List<ExtractResponse.ChunkInfo> chunks) {
        if (chunks == null || chunks.isEmpty()) return;

        List<DocumentChunk> entities = chunks.stream()
                .map(c -> DocumentChunk.builder()
                        .document(document)
                        .chunkIndex(c.getChunkIndex())
                        .content(c.getContent())
                        .embeddingId(c.getEmbeddingId())
                        .createdAt(LocalDateTime.now())
                        .build())
                .toList();

        documentChunkRepository.saveAll(entities);
    }

    private void saveMetadata(Document document, Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) return;

        try {
            String json = objectMapper.writeValueAsString(metadata);
            DocumentMetadata entity = DocumentMetadata.builder()
                    .document(document)
                    .metadataJson(json)
                    .schemaVersion("1.0")
                    .createdAt(LocalDateTime.now())
                    .build();
            documentMetadataRepository.save(entity);
        } catch (Exception e) {
            log.error("Failed to serialize metadata for document {}: {}", document.getId(), e.getMessage(), e);
        }
    }



    public RagResponse ask(RagRequest ragRequest){
        return this.aiServiceClient
                .ask(ragRequest);

    }
}