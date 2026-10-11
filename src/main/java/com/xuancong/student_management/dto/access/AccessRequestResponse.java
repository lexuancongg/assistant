package com.xuancong.student_management.dto.access;

import com.xuancong.student_management.entity.enums.AccessRequestStatus;
import com.xuancong.student_management.entity.enums.PermissionLevel;

import java.time.LocalDateTime;
import java.util.UUID;

public record AccessRequestResponse(
        Long id,
        Long folderId,
        String folderName,
        Long fileId,
        String fileName,
        Long requesterId,
        String requesterName,
        String requesterEmail,
        String requesterAvatar,
        String reason,
        PermissionLevel requestedLevel,
        AccessRequestStatus status,
        LocalDateTime createdAt,
        LocalDateTime respondedAt
) {}