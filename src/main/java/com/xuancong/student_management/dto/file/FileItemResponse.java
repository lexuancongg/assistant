package com.xuancong.student_management.dto.file;

import java.util.UUID;

public record FileItemResponse(
        UUID id,
        String name,
        String fileType,
        String owner,           // tên phòng ban chủ sở hữu
        String uploadedByName,
        String uploadedByEmail,
        String updatedAt,       // formatted string
        String size,            // formatted string, e.g. "2.4 MB"
        Long folderId
) {}
