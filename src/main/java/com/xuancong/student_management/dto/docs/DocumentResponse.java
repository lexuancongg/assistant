package com.xuancong.student_management.dto.docs;

import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.time.ZoneId;

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

    public static DocumentResponse fromFileItem(FileItem file) {
        String uploaderId = file.getUploadedBy() != null && file.getUploadedBy().getId() != null
                ? file.getUploadedBy().getId().toString() : "0";
        String uploaderName = file.getUploadedBy() != null && file.getUploadedBy().getName() != null
                ? file.getUploadedBy().getName() : "system";

        LocalDateTime uploadedAt = file.getCreatedAt() != null
                ? LocalDateTime.ofInstant(file.getCreatedAt(), ZoneId.systemDefault())
                : LocalDateTime.now();

        return DocumentResponse.builder()
                .id(file.getId() != null ? file.getId().toString() : "")
                .name(file.getName())
                .subtitle(file.getFileType())
                .type(DocumentType.OTHER)
                .status(file.isAiIndexed() ? DocumentStatus.PROCESSED : DocumentStatus.PROCESSING)
                .uploader(new Uploader(uploaderId, uploaderName))
                .uploadedAt(uploadedAt)
                .sizeBytes(file.getSizeBytes() != null ? file.getSizeBytes() : 0L)
                .extension(file.getFileType())
                .build();
    }
}
