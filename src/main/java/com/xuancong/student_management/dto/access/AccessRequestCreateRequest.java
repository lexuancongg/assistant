package com.xuancong.student_management.dto.access;

import com.xuancong.student_management.entity.enums.PermissionLevel;

public record AccessRequestCreateRequest(
        Long folderId,
        String folderName,
        Long fileId,
        String fileName,
        String reason,
        PermissionLevel requestedLevel
) {}