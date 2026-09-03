package com.xuancong.student_management.dto.forders;

import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;

import java.time.Instant;
import java.util.UUID;

public record FolderPermissionResponse(
    UUID id,
    Long folderId,
    PermissionSubjectType subjectType,
    UUID subjectId,
    String subjectName,
    String subjectDetail,
    PermissionLevel level,
    Instant createdAt
) {}