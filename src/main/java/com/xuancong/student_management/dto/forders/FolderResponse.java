package com.xuancong.student_management.dto.forders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FolderResponse(
        Long id,
        String name,
        Long parentId,
        Long companyId,
        Instant createdAt,
        List<FolderResponse> children
) {
    public static FolderResponse from(com.xuancong.student_management.entity.Folder f) {
        return new FolderResponse(
                f.getId(),
                f.getName(),
                f.getParent() != null ? f.getParent().getId() : null,
                f.getCompany() != null ? f.getCompany().getId() : null,
                f.getCreatedAt(),
                List.of()
        );
    }
}