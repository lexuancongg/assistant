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
        String uploaderId = document.getUploadedBy() != null ? document.getUploadedBy().toString() : "0";
        String uploaderName = document.getUploadedBy() != null ? "uploaded-user-" + document.getUploadedBy() : "system";
        String subtitle = "";
        if (document.getSummary() != null && !document.getSummary().isBlank()) {
            subtitle = document.getSummary().strip();
            if (subtitle.length() > 120) {
                subtitle = subtitle.substring(0, 120).strip() + "...";
            }
        }
        String extension = document.getMimeType();
        if (extension == null || extension.isBlank()) {
            String path = document.getFilePath();
            if (path != null && path.contains(".")) {
                extension = path.substring(path.lastIndexOf('.') + 1);
            }
        }

        return DocumentResponse.builder()
                .id(document.getId().toString())
                .name(document.getDocumentName())
                .subtitle(subtitle)
                .type(document.getDocumentType())
                .status(document.getStatus())
                .uploader(new Uploader(
                        uploaderId,
                        uploaderName
                ))
                .uploadedAt(document.getUploadedAt() != null ? document.getUploadedAt() : document.getCreatedAt().toLocalDateTime())
                .sizeBytes(document.getFileSize())
                .extension(extension)
                .build();
    }

}
