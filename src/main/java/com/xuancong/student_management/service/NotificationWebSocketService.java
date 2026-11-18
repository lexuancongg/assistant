package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.notification.NotificationMessage;
import com.xuancong.student_management.entity.*;
import com.xuancong.student_management.entity.enums.PermissionLevel;
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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final FolderPermissionRepository folderPermissionRepository;
    private final FolderRepository folderRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public void sendToUser(Long userId, NotificationMessage notification) {
        if (userId == null) return;
        if (notification != null && notification.getUploaderId() != null && notification.getUploaderId().equals(userId)) {
            // Không gửi thông báo tải tệp lại cho chính người tải lên
            return;
        }
        log.info("WebSocket sending notification to user {}: {}", userId, notification.getTitle());
        messagingTemplate.convertAndSend("/topic/user/" + userId, notification);
    }

    public void sendToDepartment(Long deptId, NotificationMessage notification) {
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
                .id(System.currentTimeMillis())
                .title("Tài liệu mới được chia sẻ")
                .message(uploaderName + " vừa tải lên tài liệu: \"" + fileItem.getName() + "\" vào thư mục \"" + folderName + "\"")
                .type("FILE_UPLOAD")
                .fileId(fileItem.getId())
                .fileName(fileItem.getName())
                .fileType(fileItem.getFileType())
                .folderId(folderId)
                .folderName(folderName)
                .uploaderId(uploader != null ? uploader.getId() : null)
                .uploaderName(uploaderName)
                .uploaderAvatar(uploaderAvatar)
                .timestamp(Instant.now().toString())
                .build();

        Long uploaderId = uploader != null ? uploader.getId() : null;
        Set<Long> notifiedUsers = new HashSet<>();
        if (uploaderId != null) {
            notifiedUsers.add(uploaderId);
        }

        if (folderId == null) {
            // Root file: Gửi cho công ty
            if (fileItem.getCompany() != null && fileItem.getCompany().getId() != null) {
                sendToCompany(fileItem.getCompany().getId(), notif);
            }
            return;
        }

        // Lấy danh sách phân quyền của folder đa cấp
        List<FolderPermission> permissions = new ArrayList<>();
        Folder currentFolder = folderRepository.findById(folderId).orElse(null);
        while (currentFolder != null) {
            permissions.addAll(folderPermissionRepository.findByFolderId(currentFolder.getId()));
            currentFolder = currentFolder.getParent();
        }

        if (permissions.isEmpty()) {
            // Folder mặc định: Gửi toàn công ty
            if (fileItem.getCompany() != null && fileItem.getCompany().getId() != null) {
                sendToCompany(fileItem.getCompany().getId(), notif);
            }
            return;
        }

        for (FolderPermission p : permissions) {
            if (p.getSubjectType() == PermissionSubjectType.DEPARTMENT && p.getSubjectId() != null) {
                sendToDepartment(p.getSubjectId(), notif);

                List<User> deptUsers = userRepository.findByDepartmentId(p.getSubjectId());
                for (User u : deptUsers) {
                    if (u != null && u.getId() != null && !notifiedUsers.contains(u.getId())) {
                        notifiedUsers.add(u.getId());
                        sendToUser(u.getId(), notif);
                    }
                }
            } else if (p.getSubjectType() == PermissionSubjectType.USER && p.getSubjectId() != null) {
                if (!notifiedUsers.contains(p.getSubjectId())) {
                    notifiedUsers.add(p.getSubjectId());
                    sendToUser(p.getSubjectId(), notif);
                }
            }
        }
    }

    /**
     * Thông báo yêu cầu quyền truy cập mới tới người duyệt (chủ sở hữu tệp/thư mục và các Quản trị viên)
     */
    public void notifyAccessRequest(AccessRequest request, User requester, User targetOwner, List<User> admins) {
        String requesterName = requester != null && requester.getName() != null ? requester.getName() : "Người dùng";
        String requesterAvatar = requesterName != null && !requesterName.isBlank()
                ? requesterName.substring(0, 1).toUpperCase()
                : "U";

        String targetName = request.getFileName() != null ? request.getFileName() : (request.getFolderName() != null ? request.getFolderName() : "Tài liệu");
        String levelText = request.getRequestedLevel() == PermissionLevel.EDITOR ? "Chỉnh sửa" : "Xem";

        NotificationMessage notif = NotificationMessage.builder()
                .id(System.currentTimeMillis())
                .title("Yêu cầu quyền truy cập mới")
                .message(requesterName + " vừa yêu cầu quyền " + levelText + " đối với \"" + targetName + "\"")
                .type("ACCESS_REQUEST")
                .fileId(request.getFileId())
                .fileName(request.getFileName())
                .folderId(request.getFolderId())
                .folderName(request.getFolderName())
                .uploaderId(requester != null ? requester.getId() : null)
                .uploaderName(requesterName)
                .uploaderAvatar(requesterAvatar)
                .timestamp(Instant.now().toString())
                .build();

        Set<Long> notifiedUserIds = new HashSet<>();
        if (requester != null && requester.getId() != null) {
            notifiedUserIds.add(requester.getId());
        }

        // 1. Gửi tới chủ sở hữu tệp hoặc thư mục
        if (targetOwner != null && targetOwner.getId() != null && !notifiedUserIds.contains(targetOwner.getId())) {
            notifiedUserIds.add(targetOwner.getId());
            sendToUser(targetOwner.getId(), notif);
        }

        // 2. Gửi tới tất cả Admin hệ thống
        if (admins != null) {
            for (User admin : admins) {
                if (admin != null && admin.getId() != null && !notifiedUserIds.contains(admin.getId())) {
                    notifiedUserIds.add(admin.getId());
                    sendToUser(admin.getId(), notif);
                }
            }
        }
    }

    /**
     * Thông báo kết quả phê duyệt / từ chối yêu cầu quyền truy cập tới người yêu cầu
     */
    public void notifyAccessRequestResponse(AccessRequest request, boolean approved, User approver) {
        if (request == null || request.getRequester() == null) return;
        String approverName = approver != null && approver.getName() != null ? approver.getName() : "Quản trị viên";
        String targetName = request.getFileName() != null ? request.getFileName() : (request.getFolderName() != null ? request.getFolderName() : "Tài liệu");

        NotificationMessage notif = NotificationMessage.builder()
                .id(System.currentTimeMillis())
                .title(approved ? "Yêu cầu quyền đã được duyệt" : "Yêu cầu quyền đã bị từ chối")
                .message(approverName + (approved ? " đã phê duyệt" : " đã từ chối") + " yêu cầu quyền truy cập cho \"" + targetName + "\"")
                .type(approved ? "PERMISSION_GRANTED" : "ACCESS_REQUEST_REJECTED")
                .fileId(request.getFileId())
                .fileName(request.getFileName())
                .folderId(request.getFolderId())
                .folderName(request.getFolderName())
                .timestamp(Instant.now().toString())
                .build();

        sendToUser(request.getRequester().getId(), notif);
    }
}
