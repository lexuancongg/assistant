package com.xuancong.student_management.dto.forders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FolderResponse(
        Long id,
        String name,
        Long parentId,
        Long companyId,
        Long ownerId,
        String ownerName,
        String ownerEmail,
        Instant createdAt,
        List<FolderResponse> children
) {
    public static FolderResponse from(com.xuancong.student_management.entity.Folder f) {
        com.xuancong.student_management.entity.User u = f.getCreatedBy();
        return new FolderResponse(
                f.getId(),
                f.getName(),
                f.getParent() != null ? f.getParent().getId() : null,
                f.getCompany() != null ? f.getCompany().getId() : null,
                u != null ? u.getId() : null,
                u != null ? u.getName() : null,
                u != null ? u.getEmail() : null,
                f.getCreatedAt(),
                List.of()
        );
    }
}