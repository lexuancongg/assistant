package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.file.FileItemResponse;
import com.xuancong.student_management.dto.file.TrashItemResponse;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.ActivityType;
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.FolderRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileManagementService {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final FileItemRepository fileItemRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final CompanyRepository companyRepository;
    private final S3FileService s3FileService;
    private final AiService aiService;
    private final ActivityLogManagementService activityLogManagementService;
    private final NotificationWebSocketService notificationWebSocketService;

    public List<FileItemResponse> getActiveFiles() {
        return fileItemRepository.findByDeletedAtIsNull()
                .stream()
                .map(this::toFileResponse)
                .toList();
    }

    public FileItemResponse getFileDetail(UUID id) {
        FileItem file = getOrThrow(id);
        return toFileResponse(file);
    }

    public FileItemResponse uploadFile(MultipartFile file, Long folderId) {
        String filePathS3;
        try {
            filePathS3 = s3FileService.uploadFile(file);
        } catch (Exception e) {
            log.error("Upload file to S3 failed: {}", e.getMessage(), e);
            throw new RuntimeException("Upload file to S3 failed", e);
        }

        User uploader = getAuthenticatedUser();
        if (uploader == null) {
            uploader = userRepository.findAll().stream().findFirst().orElse(null);
        }

        Company company = (uploader != null && uploader.getCompany() != null)
                ? uploader.getCompany()
                : companyRepository.findAll().stream().findFirst().orElse(null);

        FileItem fileItem = new FileItem();
        fileItem.setName(file.getOriginalFilename());
        fileItem.setFileType(extractExtension(file.getOriginalFilename()));
        fileItem.setSizeBytes(file.getSize());
        fileItem.setUploadedBy(uploader);
        fileItem.setCompany(company);

        if (folderId != null) {
            folderRepository.findById(folderId).ifPresent(fileItem::setFolder);
        }

        fileItem = fileItemRepository.save(fileItem);
        aiService.processAsync(fileItem.getId(), filePathS3);

        activityLogManagementService.logActivity(
                company,
                uploader,
                ActivityType.UPLOAD,
                fileItem,
                Map.of("fileName", fileItem.getName() != null ? fileItem.getName() : "")
        );

        // Bắn thông báo Real-time qua WebSocket cho các bên được phân quyền
        try {
            notificationWebSocketService.notifyFileUploadPermissions(fileItem, folderId, uploader);
        } catch (Exception ex) {
            log.warn("Không thể gửi thông báo WebSocket: {}", ex.getMessage());
        }

        return toFileResponse(fileItem);
    }

    public List<TrashItemResponse> getTrash() {
        return fileItemRepository.findByDeletedAtIsNotNull()
                .stream()
                .map(this::toTrashResponse)
                .toList();
    }

    public void softDelete(UUID id) {
        FileItem file = getOrThrow(id);
        file.setDeletedAt(Instant.now());
        fileItemRepository.save(file);

        activityLogManagementService.logActivity(
                file.getCompany(),
                getAuthenticatedUser(),
                ActivityType.DELETE,
                file,
                Map.of("fileName", file.getName() != null ? file.getName() : "")
        );
    }

    public void restore(UUID id) {
        FileItem file = getOrThrow(id);
        file.setDeletedAt(null);
        fileItemRepository.save(file);

        activityLogManagementService.logActivity(
                file.getCompany(),
                getAuthenticatedUser(),
                ActivityType.UPDATE,
                file,
                Map.of("fileName", file.getName() != null ? file.getName() : "")
        );
    }

    public void deletePermanently(UUID id) {
        FileItem file = getOrThrow(id);
        if (file.getDeletedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File chưa được đưa vào thùng rác");
        }
        activityLogManagementService.logActivity(
                file.getCompany(),
                getAuthenticatedUser(),
                ActivityType.DELETE,
                null,
                Map.of("fileName", file.getName() != null ? file.getName() : "")
        );
        fileItemRepository.delete(file);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            String email = authentication.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "pdf";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private FileItem getOrThrow(UUID id) {
        return fileItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    private FileItemResponse toFileResponse(FileItem f) {
        String ownerName = f.getOwnerDepartment() != null ? f.getOwnerDepartment().getName()
                : (f.getUploadedBy() != null ? f.getUploadedBy().getName() : "");
        String uploaderName = f.getUploadedBy() != null ? f.getUploadedBy().getName() : "";
        String uploaderEmail = f.getUploadedBy() != null ? f.getUploadedBy().getEmail() : "";
        String updatedAt = FMT.format(f.getUpdatedAt());
        String size = formatBytes(f.getSizeBytes());

        return new FileItemResponse(
                f.getId(),
                f.getName(),
                f.getFileType(),
                ownerName,
                uploaderName,
                uploaderEmail,
                updatedAt,
                size,
                f.getFolder() != null ? f.getFolder().getId() : null
        );
    }

    private TrashItemResponse toTrashResponse(FileItem f) {
        String deletedBy = f.getUploadedBy() != null ? f.getUploadedBy().getName() : "";
        String deletedAt = f.getDeletedAt() != null ? FMT.format(f.getDeletedAt()) : "";
        return new TrashItemResponse(
                f.getId(),
                f.getName(),
                f.getFileType(),
                deletedBy,
                deletedAt,
                formatBytes(f.getSizeBytes())
        );
    }

    private String formatBytes(Long bytes) {
        if (bytes == null) return "0 KB";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.0f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
