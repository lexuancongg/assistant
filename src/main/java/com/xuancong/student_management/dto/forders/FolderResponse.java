package com.xuancong.student_management.dto.forders;

import java.time.Instant;
import java.util.List;

public record FolderResponse(
        Long id,
        String name,
        Long parentId,
        Long companyId,
        Long ownerId,
        String ownerName,
        String ownerEmail,
        Instant createdAt,
        List<FolderResponse> children,
        Boolean canUpload,
        Boolean canManageOwner
) {
    public FolderResponse(Long id, String name, Long parentId, Long companyId, Long ownerId, String ownerName, String ownerEmail, Instant createdAt, List<FolderResponse> children) {
        this(id, name, parentId, companyId, ownerId, ownerName, ownerEmail, createdAt, children, true, false);
    }

    public FolderResponse(Long id, String name, Long parentId, Long companyId, Long ownerId, String ownerName, String ownerEmail, Instant createdAt, List<FolderResponse> children, Boolean canUpload) {
        this(id, name, parentId, companyId, ownerId, ownerName, ownerEmail, createdAt, children, canUpload, false);
    }

    public static FolderResponse from(com.xuancong.student_management.entity.Folder f) {
        return from(f, true, false);
    }

    public static FolderResponse from(com.xuancong.student_management.entity.Folder f, boolean canUpload) {
        return from(f, canUpload, false);
    }

    public static FolderResponse from(com.xuancong.student_management.entity.Folder f, boolean canUpload, boolean canManageOwner) {
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
                List.of(),
                canUpload,
                canManageOwner
        );
    }
}
