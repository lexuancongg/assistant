package com.xuancong.student_management.dto.forders;

import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;

import java.util.List;
import java.util.UUID;

public record FolderPermissionUpdateRequest(
    String accessScope,
    Long ownerId,
    List<FolderPermissionItemRequest> permissions
) {
    public record FolderPermissionItemRequest(
        PermissionSubjectType subjectType,
        Long subjectId,
        PermissionLevel level
    ) {}
}