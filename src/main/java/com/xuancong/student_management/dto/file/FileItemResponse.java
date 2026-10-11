package com.xuancong.student_management.dto.file;

import java.util.List;
import java.util.UUID;

public record FileItemResponse(
        Long id,
        String name,
        String fileType,
        String owner,           // tên phòng ban chủ sở hữu
        String uploadedByName,
        String uploadedByEmail,
        String updatedAt,       // formatted string
        String size,            // formatted string, e.g. "2.4 MB"
        Long folderId,
        String folderName,
        Boolean aiIndexed,
        String storagePath,
        String visibility,
        List<String> tags,
        String thumbnailPath
) {}
