package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.access.AccessRequestCreateRequest;
import com.xuancong.student_management.dto.access.AccessRequestResponse;
import com.xuancong.student_management.entity.AccessRequest;
import com.xuancong.student_management.entity.Folder;
import com.xuancong.student_management.entity.FolderPermission;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.AccessRequestStatus;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import com.xuancong.student_management.repository.AccessRequestRepository;
import com.xuancong.student_management.repository.FolderPermissionRepository;
import com.xuancong.student_management.repository.FolderRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final AccessRequestRepository accessRequestRepository;
    private final FolderRepository folderRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final UserRepository userRepository;
    private final com.xuancong.student_management.repository.FileItemRepository fileItemRepository;

    @Transactional
    public AccessRequestResponse createRequest(AccessRequestCreateRequest req, User currentUser) {
        if (currentUser == null) {
            currentUser = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        }

        AccessRequest entity = AccessRequest.builder()
                .folderId(req.folderId())
                .folderName(req.folderName())
                .fileId(req.fileId())
                .fileName(req.fileName())
                .requester(currentUser)
                .reason(req.reason())
                .requestedLevel(req.requestedLevel() != null ? req.requestedLevel() : PermissionLevel.VIEWER)
                .status(AccessRequestStatus.PENDING)
                .build();

        AccessRequest saved = accessRequestRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AccessRequestResponse> getAllRequests(User currentUser) {
        if (currentUser == null) return List.of();
        // Chỉ ADMIN mới xem được tất cả các yêu cầu trong hệ thống
        if (currentUser.getRole() == com.xuancong.student_management.entity.enums.UserRole.ADMIN) {
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
        if (currentUser.getRole() == com.xuancong.student_management.entity.enums.UserRole.ADMIN) {
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
        if (currentUser == null || currentUser.getRole() != com.xuancong.student_management.entity.enums.UserRole.ADMIN) {
            return 0L;
        }
        return accessRequestRepository.countByStatus(AccessRequestStatus.PENDING);
    }

    @Transactional
    public AccessRequestResponse approveRequest(Long requestId, User approver) {
        if (approver == null || approver.getRole() != com.xuancong.student_management.entity.enums.UserRole.ADMIN) {
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

        // Tự động cấp quyền vào Folder nếu có folderId
        if (request.getFolderId() != null) {
            Folder folder = folderRepository.findById(request.getFolderId()).orElse(null);
            if (folder != null) {
                // Kiểm tra xem đã có permission cho user này chưa
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

        return toResponse(request);
    }

    @Transactional
    public AccessRequestResponse rejectRequest(Long requestId, User approver) {
        if (approver == null || approver.getRole() != com.xuancong.student_management.entity.enums.UserRole.ADMIN) {
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