package com.xuancong.student_management.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private String id;
    private String title;
    private String message;
    private String type; // FILE_UPLOAD, PERMISSION_GRANTED, ACCESS_REQUEST
    private String fileId;
    private String fileName;
    private String fileType;
    private Long folderId;
    private String folderName;
    private String uploaderId;
    private String uploaderName;
    private String uploaderAvatar;
    private String targetType; // USER, DEPARTMENT, COMPANY
    private String targetId;
    private String timestamp;
}