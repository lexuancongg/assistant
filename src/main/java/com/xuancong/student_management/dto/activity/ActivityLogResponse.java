package com.xuancong.student_management.dto.activity;

import java.util.UUID;

public record ActivityLogResponse(
        Long id,
        String actorName,
        String action,         // "đã upload file" / "đã xóa file" ...
        String targetName,     // tên file mục tiêu
        String timestamp,      // formatted string
        String type,           // UPLOAD | SHARE | DOWNLOAD | DELETE | UPDATE
        Long fileId,
        String fileType,
        String ownerName,
        String location
) {
    public ActivityLogResponse(Long id, String actorName, String action, String targetName, String timestamp, String type) {
        this(id, actorName, action, targetName, timestamp, type, null, null, null, null);
    }
}
