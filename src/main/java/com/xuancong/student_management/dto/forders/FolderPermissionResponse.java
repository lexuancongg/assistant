package com.xuancong.student_management.dto.forders;

import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;

import java.time.Instant;

public record FolderPermissionResponse(
    Long id,
    Long folderId,
    PermissionSubjectType subjectType,
    Long subjectId,
    String subjectName,
    String subjectDetail,
    PermissionLevel level,
    Instant createdAt,
    Boolean inherited,
    String inheritedFromName
) {
    public FolderPermissionResponse(Long id, Long folderId, PermissionSubjectType subjectType, Long subjectId, String subjectName, String subjectDetail, PermissionLevel level, Instant createdAt) {
        this(id, folderId, subjectType, subjectId, subjectName, subjectDetail, level, createdAt, false, null);
    }
}
