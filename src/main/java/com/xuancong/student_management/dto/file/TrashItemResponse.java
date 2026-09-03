package com.xuancong.student_management.dto.file;

import java.util.UUID;

public record TrashItemResponse(
        UUID id,
        String name,
        String fileType,
        String deletedBy,    // tên người xóa
        String deletedAt,    // formatted string
        String size
) {}
