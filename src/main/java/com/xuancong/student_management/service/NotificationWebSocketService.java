package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.notification.NotificationMessage;
import com.xuancong.student_management.entity.*;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import com.xuancong.student_management.repository.DepartmentRepository;
import com.xuancong.student_management.repository.FolderPermissionRepository;
import com.xuancong.student_management.repository.FolderRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final FolderPermissionRepository folderPermissionRepository;
    private final FolderRepository folderRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public void sendToUser(UUID userId, NotificationMessage notification) {
        log.info("WebSocket sending notification to user {}: {}", userId, notification.getTitle());
        messagingTemplate.convertAndSend("/topic/user/" + userId, notification);
    }

    public void sendToDepartment(UUID deptId, NotificationMessage notification) {
        log.info("WebSocket sending notification to department {}: {}", deptId, notification.getTitle());
        messagingTemplate.convertAndSend("/topic/department/" + deptId, notification);
    }

    public void sendToCompany(Long companyId, NotificationMessage notification) {
        log.info("WebSocket sending notification to company {}: {}", companyId, notification.getTitle());
        messagingTemplate.convertAndSend("/topic/company/" + companyId, notification);
    }

    public void broadcast(NotificationMessage notification) {
        log.info("WebSocket broadcasting notification: {}", notification.getTitle());
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /**
     * Tự động phân phối thông báo khi một file mới được upload dựa theo phân quyền thư mục
     */
    public void notifyFileUploadPermissions(FileItem fileItem, Long folderId, User uploader) {
        String uploaderName = uploader != null ? uploader.getName() : "Một người dùng";
        String uploaderAvatar = uploaderName != null && !uploaderName.isBlank()
                ? uploaderName.substring(0, 1).toUpperCase()
                : "U";

        String folderName = "Tất cả file";
        if (folderId != null) {
            Folder f = folderRepository.findById(folderId).orElse(null);
            if (f != null && f.getName() != null) {
                folderName = f.getName();
            }
        }

        NotificationMessage notif = NotificationMessage.builder()
                .id(UUID.randomUUID().toString())
                .title("Tài liệu mới được chia sẻ")
                .message(uploaderName + " vừa tải lên tài liệu: \"" + fileItem.getName() + "\" vào thư mục \"" + folderName + "\"")
                .type("FILE_UPLOAD")
                .fileId(fileItem.getId() != null ? fileItem.getId().toString() : "")
                .fileName(fileItem.getName())
                .fileType(fileItem.getFileType())
                .folderId(folderId)
                .folderName(folderName)
                .uploaderId(uploader != null && uploader.getId() != null ? uploader.getId().toString() : "")
                .uploaderName(uploaderName)
                .uploaderAvatar(uploaderAvatar)
                .timestamp(Instant.now().toString())
                .build();

        // Broadcast to general channel
        broadcast(notif);

        if (folderId == null) {
            // Root file: Gửi cho phòng ban của uploader hoặc toàn công ty
            if (fileItem.getCompany() != null && fileItem.getCompany().getId() != null) {
                sendToCompany(fileItem.getCompany().getId(), notif);
            }
            return;
        }

        // Lấy danh sách phân quyền của folder
        List<FolderPermission> permissions = folderPermissionRepository.findByFolderId(folderId);

        if (permissions.isEmpty()) {
            // Folder mặc định không có restricted permissions: Gửi toàn công ty
            if (fileItem.getCompany() != null && fileItem.getCompany().getId() != null) {
                sendToCompany(fileItem.getCompany().getId(), notif);
            }
            return;
        }

        Set<UUID> notifiedUsers = new HashSet<>();

        for (FolderPermission p : permissions) {
            if (p.getSubjectType() == PermissionSubjectType.DEPARTMENT && p.getSubjectId() != null) {
                // Gửi thông báo tới kênh của phòng ban
                sendToDepartment(p.getSubjectId(), notif);

                // Đồng thời gửi tới từng user trong phòng ban
                List<User> deptUsers = userRepository.findByDepartmentId(p.getSubjectId());
                for (User u : deptUsers) {
                    if (u != null && u.getId() != null && !notifiedUsers.contains(u.getId())) {
                        notifiedUsers.add(u.getId());
                        sendToUser(u.getId(), notif);
                    }
                }
            } else if (p.getSubjectType() == PermissionSubjectType.USER && p.getSubjectId() != null) {
                // Gửi thông báo tới kênh cá nhân riêng
                if (!notifiedUsers.contains(p.getSubjectId())) {
                    notifiedUsers.add(p.getSubjectId());
                    sendToUser(p.getSubjectId(), notif);
                }
            }
        }
    }
}