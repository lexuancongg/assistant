package com.xuancong.student_management.dto.docs;

import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;
import com.xuancong.student_management.model.Document;
import lombok.Builder;

import java.time.LocalDateTime;
@Builder
public record DocumentResponse(
        String id,
        String name,
        String subtitle,
        DocumentType type,
        DocumentStatus status,
        Uploader uploader,
        LocalDateTime uploadedAt,
        long sizeBytes,
        String extension
) {

    public record Uploader(
            String id,
            String name
    ) {
    }

    public static DocumentResponse fromDocument(Document document) {
        return DocumentResponse.builder()
                .id(document.getId().toString())
                .name(document.getDocumentName())
                .subtitle("")
                .type(document.getDocumentType())
                .status(document.getStatus())
                .uploader(new Uploader(
                        "1",
                        "lê xuân công"
                ))
                .uploadedAt(document.getCreatedAt().toLocalDateTime())
                .sizeBytes(document.getFileSize())
                .extension(document.getMimeType())
                .build();
    }

}
