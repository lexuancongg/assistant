package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.access.AccessRequestCreateRequest;
import com.xuancong.student_management.dto.access.AccessRequestResponse;
import com.xuancong.student_management.entity.*;
import com.xuancong.student_management.entity.enums.AccessRequestStatus;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import com.xuancong.student_management.entity.enums.UserRole;
import com.xuancong.student_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final AccessRequestRepository accessRequestRepository;
    private final FolderRepository folderRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final UserRepository userRepository;
    private final FileItemRepository fileItemRepository;
    private final FilePermissionRepository filePermissionRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    @Transactional
    public AccessRequestResponse createRequest(AccessRequestCreateRequest req, User currentUser) {
        if (currentUser == null) {
            currentUser = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        }

        // 1. Kiểm tra trùng lặp: Nếu đang có yêu cầu PENDING thì không cho gửi lại
        if (req.fileId() != null) {
            boolean hasPending = accessRequestRepository.existsByRequesterIdAndFileIdAndStatus(
                    currentUser.getId(), req.fileId(), AccessRequestStatus.PENDING
            );
            if (hasPending) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã gửi yêu cầu quyền truy cập cho tệp này và đang chờ duyệt.");
            }
        } else if (req.folderId() != null) {
            boolean hasPending = accessRequestRepository.existsByRequesterIdAndFolderIdAndStatus(
                    currentUser.getId(), req.folderId(), AccessRequestStatus.PENDING
            );
            if (hasPending) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã gửi yêu cầu quyền truy cập cho thư mục này và đang chờ duyệt.");
            }
        }

        // 2. Xác định chủ sở hữu và tên đối tượng cần xin quyền
        User targetOwner = null;
        String resolvedName = req.fileName();

        if (req.fileId() != null) {
            var fileOpt = fileItemRepository.findById(req.fileId());
            if (fileOpt.isPresent()) {
                FileItem file = fileOpt.get();
                targetOwner = file.getUploadedBy();
                if (resolvedName == null || resolvedName.isBlank()) {
                    resolvedName = file.getName();
                }
            }
        } else if (req.folderId() != null) {
            var folderOpt = folderRepository.findById(req.folderId());
            if (folderOpt.isPresent()) {
                Folder folder = folderOpt.get();
                targetOwner = folder.getCreatedBy();
                if (resolvedName == null || resolvedName.isBlank()) {
                    resolvedName = folder.getName();
                }
            }
        }

        // 3. Tạo và lưu AccessRequest
        AccessRequest entity = AccessRequest.builder()
                .folderId(req.folderId())
                .folderName(req.folderId() != null ? resolvedName : req.folderName())
                .fileId(req.fileId())
                .fileName(req.fileId() != null ? resolvedName : req.fileName())
                .requester(currentUser)
                .reason(req.reason())
                .requestedLevel(req.requestedLevel() != null ? req.requestedLevel() : PermissionLevel.VIEWER)
                .status(AccessRequestStatus.PENDING)
                .build();

        AccessRequest saved = accessRequestRepository.save(entity);

        // 4. Gửi thông báo WebSocket tới người duyệt (Chủ sở hữu & Tất cả Quản trị viên ADMIN)
        try {
            List<User> admins = userRepository.findByRole(UserRole.ADMIN);
            notificationWebSocketService.notifyAccessRequest(saved, currentUser, targetOwner, admins);
        } catch (Exception e) {
            // Không làm gián đoạn việc tạo yêu cầu nếu gửi WebSocket gặp sự cố
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public boolean hasPendingRequest(Long fileId, Long folderId, User currentUser) {
        if (currentUser == null) return false;
        if (fileId != null) {
            return accessRequestRepository.existsByRequesterIdAndFileIdAndStatus(
                    currentUser.getId(), fileId, AccessRequestStatus.PENDING
            );
        }
        if (folderId != null) {
            return accessRequestRepository.existsByRequesterIdAndFolderIdAndStatus(
                    currentUser.getId(), folderId, AccessRequestStatus.PENDING
            );
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<AccessRequestResponse> getAllRequests(User currentUser) {
        if (currentUser == null) return List.of();
        // Chỉ ADMIN mới xem được tất cả các yêu cầu trong hệ thống
        if (currentUser.getRole() == UserRole.ADMIN) {
            return accessRequestRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                    .stream()
                    .filter(r -> r.getFileId() == null || fileItemRepository.existsById(r.getFileId()))
                    .map(this::toResponse)
                    .toList();
        }
        // User thông thường chỉ xem được các yêu cầu do chính mình tạo
        return getMyRequests(currentUser);
    }

    @Transactional(readOnly = true)
    public List<AccessRequestResponse> getPendingRequests(User currentUser) {
        if (currentUser == null) return List.of();
        // Chỉ ADMIN mới có danh sách yêu cầu cần duyệt
        if (currentUser.getRole() == UserRole.ADMIN) {
            return accessRequestRepository.findByStatusOrderByCreatedAtDesc(AccessRequestStatus.PENDING)
                    .stream()
                    .filter(r -> r.getFileId() == null || fileItemRepository.existsById(r.getFileId()))
                    .map(this::toResponse)
                    .toList();
        }
        // User thông thường không có quyền duyệt yêu cầu của ai khác
        return List.of();
    }

    @Transactional(readOnly = true)
    public List<AccessRequestResponse> getMyRequests(User currentUser) {
        if (currentUser == null) return List.of();
        return accessRequestRepository.findByRequesterIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .filter(r -> r.getFileId() == null || fileItemRepository.existsById(r.getFileId()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getPendingCount(User currentUser) {
        if (currentUser == null || currentUser.getRole() != UserRole.ADMIN) {
            return 0L;
        }
        return accessRequestRepository.countByStatus(AccessRequestStatus.PENDING);
    }

    @Transactional
    public AccessRequestResponse approveRequest(Long requestId, User approver) {
        if (approver == null || approver.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Quản trị viên (ADMIN) mới có quyền phê duyệt yêu cầu");
        }

        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yêu cầu không tồn tại"));

        if (request.getStatus() != AccessRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu đã được xử lý trước đó");
        }

        request.setStatus(AccessRequestStatus.APPROVED);
        request.setApprover(approver);
        request.setRespondedAt(LocalDateTime.now());
        accessRequestRepository.save(request);

        // 1. Tự động cấp quyền vào Folder nếu là yêu cầu cấp quyền Folder
        if (request.getFolderId() != null) {
            Folder folder = folderRepository.findById(request.getFolderId()).orElse(null);
            if (folder != null) {
                List<FolderPermission> existing = folderPermissionRepository.findByFolderId(folder.getId());
                boolean alreadyGranted = existing.stream().anyMatch(p ->
                        p.getSubjectType() == PermissionSubjectType.USER &&
                        p.getSubjectId().equals(request.getRequester().getId())
                );

                if (!alreadyGranted) {
                    FolderPermission perm = new FolderPermission();
                    perm.setFolder(folder);
                    perm.setSubjectType(PermissionSubjectType.USER);
                    perm.setSubjectId(request.getRequester().getId());
                    perm.setLevel(request.getRequestedLevel());
                    folderPermissionRepository.save(perm);
                }
            }
        }

        // 2. Tự động cấp quyền vào File nếu là yêu cầu cấp quyền File
        if (request.getFileId() != null) {
            FileItem file = fileItemRepository.findById(request.getFileId()).orElse(null);
            if (file != null) {
                List<FilePermission> existing = filePermissionRepository.findByFileId(file.getId());
                boolean alreadyGranted = existing.stream().anyMatch(p ->
                        p.getSubjectType() == PermissionSubjectType.USER &&
                        p.getSubjectId().equals(request.getRequester().getId())
                );

                if (!alreadyGranted) {
                    FilePermission perm = new FilePermission();
                    perm.setFile(file);
                    perm.setSubjectType(PermissionSubjectType.USER);
                    perm.setSubjectId(request.getRequester().getId());
                    perm.setLevel(request.getRequestedLevel());
                    perm.setGrantedBy(approver);
                    filePermissionRepository.save(perm);
                }
            }
        }

        // 3. Gửi thông báo phê duyệt tới người yêu cầu qua WebSocket
        try {
            notificationWebSocketService.notifyAccessRequestResponse(request, true, approver);
        } catch (Exception e) {
            // ignore
        }

        return toResponse(request);
    }

    @Transactional
    public AccessRequestResponse rejectRequest(Long requestId, User approver) {
        if (approver == null || approver.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Quản trị viên (ADMIN) mới có quyền từ chối yêu cầu");
        }

        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Yêu cầu không tồn tại"));

        if (request.getStatus() != AccessRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu đã được xử lý trước đó");
        }

        request.setStatus(AccessRequestStatus.REJECTED);
        request.setApprover(approver);
        request.setRespondedAt(LocalDateTime.now());
        accessRequestRepository.save(request);

        // Gửi thông báo từ chối tới người yêu cầu qua WebSocket
        try {
            notificationWebSocketService.notifyAccessRequestResponse(request, false, approver);
        } catch (Exception e) {
            // ignore
        }

        return toResponse(request);
    }

    private AccessRequestResponse toResponse(AccessRequest r) {
        User reqUser = r.getRequester();
        String name = reqUser != null ? reqUser.getName() : "Người dùng";
        String email = reqUser != null ? reqUser.getEmail() : "";
        String initial = name != null && !name.isBlank() ? name.substring(0, 1).toUpperCase() : "U";

        return new AccessRequestResponse(
                r.getId(),
                r.getFolderId(),
                r.getFolderName(),
                r.getFileId(),
                r.getFileName(),
                reqUser != null ? reqUser.getId() : null,
                name,
                email,
                initial,
                r.getReason(),
                r.getRequestedLevel(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getRespondedAt()
        );
    }
}
