package com.xuancong.student_management.dto.activity;

import java.util.UUID;

public record ActivityLogResponse(
        UUID id,
        String actorName,
        String action,         // "đã upload file" / "đã xóa file" ...
        String targetName,     // tên file mục tiêu
        String timestamp,      // formatted string
        String type            // UPLOAD | SHARE | DOWNLOAD | DELETE | UPDATE
) {}
