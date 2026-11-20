package com.xuancong.student_management.dto.activity;

import java.util.Map;

public record ActivityLogResponse(
        Long id,
        String actorName,
        String action,         // "đã tải lên một mục" / "đã chỉnh sửa một mục" ...
        String targetName,     // tên file mục tiêu
        String timestamp,      // formatted string
        String type,           // UPLOAD | SHARE | DOWNLOAD | DELETE | UPDATE
        Long fileId,
        String fileType,
        String ownerName,
        String location,
        String actorEmail,
        String actorAvatarUrl,
        String changeDescription,
        Map<String, Object> metadata,
        String createdAtIso
) {
    public ActivityLogResponse(Long id, String actorName, String action, String targetName, String timestamp, String type) {
        this(id, actorName, action, targetName, timestamp, type, null, null, null, null, null, null, null, null, null);
    }

    public ActivityLogResponse(Long id, String actorName, String action, String targetName, String timestamp, String type, Long fileId, String fileType, String ownerName, String location) {
        this(id, actorName, action, targetName, timestamp, type, fileId, fileType, ownerName, location, null, null, null, null, null);
    }
}
