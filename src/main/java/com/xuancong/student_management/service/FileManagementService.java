package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.file.FileItemResponse;
import com.xuancong.student_management.dto.file.FilePermissionResponse;
import com.xuancong.student_management.dto.file.FilePermissionUpdateRequest;
import com.xuancong.student_management.dto.file.FileVersionResponse;
import com.xuancong.student_management.dto.file.TrashItemResponse;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.Department;
import com.xuancong.student_management.entity.DocumentChunk;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.entity.FilePermission;
import com.xuancong.student_management.entity.FileTag;
import com.xuancong.student_management.entity.FileVersion;
import com.xuancong.student_management.entity.Folder;
import com.xuancong.student_management.entity.FolderPermission;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.UserStarredFile;
import com.xuancong.student_management.repository.UserStarredFileRepository;
import com.xuancong.student_management.entity.enums.ActivityType;
import com.xuancong.student_management.entity.enums.FileVisibility;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import com.xuancong.student_management.entity.enums.UserRole;
import com.xuancong.student_management.repository.AccessRequestRepository;
import com.xuancong.student_management.repository.ActivityLogRepository;
import com.xuancong.student_management.repository.ChatCitationRepository;
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.DepartmentRepository;
import com.xuancong.student_management.repository.DocumentChunkRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.FilePermissionRepository;
import com.xuancong.student_management.repository.FileVersionRepository;
import com.xuancong.student_management.repository.FolderPermissionRepository;
import com.xuancong.student_management.repository.FolderRepository;
import com.xuancong.student_management.repository.UserRepository;
import com.xuancong.student_management.dto.client.ExtractRequest;
import com.xuancong.student_management.dto.client.ExtractResponse;
import com.xuancong.student_management.util.InMemoryMultipartFile;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.nio.charset.StandardCharsets;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

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
    private final FilePermissionRepository filePermissionRepository;
    private final FileVersionRepository fileVersionRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final DepartmentRepository departmentRepository;
    private final S3FileService s3FileService;
    private final AiService aiService;
    private final AIServiceClient aiServiceClient;
    private final ActivityLogManagementService activityLogManagementService;
    private final NotificationWebSocketService notificationWebSocketService;
    private final ActivityLogRepository activityLogRepository;
    private final ChatCitationRepository chatCitationRepository;
    private final FolderService folderService;
    private final UserStarredFileRepository userStarredFileRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final AccessRequestRepository accessRequestRepository;

    @jakarta.annotation.PostConstruct
    @Transactional
    public void cleanupOrphanedData() {
        try {
            accessRequestRepository.cleanOrphanedFileRequests();
        } catch (Exception e) {
            log.warn("Could not clean orphaned access requests: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<Long> getStarredFileIds() {
        User currentUser = getAuthenticatedUser();
        if (currentUser == null) return List.of();
        return userStarredFileRepository.findStarredFileIdsByUserId(currentUser.getId());
    }

    @Transactional
    public boolean toggleStar(Long fileId) {
        User currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để đánh dấu sao");
        }
        FileItem file = getOrThrow(fileId);
        Optional<UserStarredFile> existing = userStarredFileRepository.findByUserIdAndFileId(currentUser.getId(), fileId);
        if (existing.isPresent()) {
            userStarredFileRepository.delete(existing.get());
            return false;
        } else {
            UserStarredFile starred = new UserStarredFile(currentUser, file);
            userStarredFileRepository.save(starred);
            return true;
        }
    }

    public List<FileItemResponse> getActiveFiles() {
        User currentUser = getAuthenticatedUser();
        return fileItemRepository.findByDeletedAtIsNull()
                .stream()
                .filter(f -> hasFileAccess(f, currentUser, PermissionLevel.VIEWER))
                .map(this::toFileResponse)
                .toList();
    }

    public List<FileItemResponse> getSharedWithMeFiles() {
        User currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return List.of();
        }
        return fileItemRepository.findByDeletedAtIsNull()
                .stream()
                .filter(f -> {
                    // Loại bỏ các tệp do chính user hiện tại tải lên
                    if (f.getUploadedBy() != null && f.getUploadedBy().getId().equals(currentUser.getId())) {
                        return false;
                    }
                    // Phải có quyền xem trở lên
                    return hasFileAccess(f, currentUser, PermissionLevel.VIEWER);
                })
                .map(this::toFileResponse)
                .toList();
    }

    public FileItemResponse getFileDetail(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài liệu này");
        }
        return toFileResponse(file);
    }

    public FileItemResponse uploadFile(MultipartFile file, Long folderId) {
        return uploadFile(file, folderId, null);
    }

    public FileItemResponse uploadFile(MultipartFile file, Long folderId, List<String> tags) {
        return uploadFile(file, folderId, tags, null);
    }

    @Transactional
    public FileItemResponse uploadFile(MultipartFile file, Long folderId, List<String> tags, MultipartFile thumbnail) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        User uploader = getAuthenticatedUser();
        Company company = (uploader != null && uploader.getCompany() != null)
                ? uploader.getCompany()
                : companyRepository.findAll().stream().findFirst().orElse(null);

        Folder folder = null;
        if (folderId != null) {
            folder = folderRepository.findById(folderId).orElse(null);
        }

        Department ownerDept = (uploader != null) ? uploader.getDepartment() : null;
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
        String ext = extractExtension(originalFilename);

        FileItem fileItem = new FileItem();
        fileItem.setName(originalFilename);
        fileItem.setFileType(ext);
        fileItem.setSizeBytes(file.getSize());
        fileItem.setCompany(company);
        fileItem.setFolder(folder);
        fileItem.setOwnerDepartment(ownerDept);
        fileItem.setUploadedBy(uploader);
        fileItem.setVisibility(FileVisibility.INHERIT);
        fileItem.setAiIndexed(false);
        fileItem.setCreatedAt(Instant.now());
        fileItem.setUpdatedAt(Instant.now());

        if (tags != null && !tags.isEmpty()) {
            for (String tagStr : tags) {
                if (tagStr != null && !tagStr.isBlank()) {
                    FileTag ft = new FileTag();
                    ft.setFile(fileItem);
                    ft.setTag(tagStr.trim());
                    fileItem.getTags().add(ft);
                }
            }
        }

        fileItem = fileItemRepository.save(fileItem);

        String filePathS3 = "";
        try {
            filePathS3 = s3FileService.uploadFile(file);
            fileItem.setStoragePath(filePathS3);
        } catch (Exception e) {
            log.error("Upload to S3 failed: {}", e.getMessage(), e);
            throw new RuntimeException("Upload to S3 failed", e);
        }

        // Handle thumbnail upload or auto-generate for images
        if (thumbnail != null && !thumbnail.isEmpty()) {
            try {
                String thumbPath = s3FileService.uploadThumbnail(thumbnail);
                fileItem.setThumbnailPath(thumbPath);
            } catch (Exception e) {
                log.warn("Upload thumbnail to S3 failed for file {}: {}", fileItem.getId(), e.getMessage());
            }
        } else if (ext.matches("^(png|jpg|jpeg|webp|gif|bmp)$")) {
            try {
                BufferedImage original = ImageIO.read(file.getInputStream());
                if (original != null) {
                    int targetWidth = Math.min(480, original.getWidth());
                    int targetHeight = (int) (((double) original.getHeight() / original.getWidth()) * targetWidth);
                    BufferedImage thumb = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
                    Graphics2D g2d = thumb.createGraphics();
                    g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                    g2d.drawImage(original, 0, 0, targetWidth, targetHeight, null);
                    g2d.dispose();

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    ImageIO.write(thumb, "jpg", baos);
                    String thumbPath = s3FileService.uploadThumbnailBytes(baos.toByteArray());
                    fileItem.setThumbnailPath(thumbPath);
                }
            } catch (Exception e) {
                log.warn("Auto-generate image thumbnail failed for file {}: {}", fileItem.getId(), e.getMessage());
            }
        }

        FileVersion v1 = new FileVersion();
        v1.setFile(fileItem);
        v1.setVersionNo(1);
        v1.setStoragePath(filePathS3);
        v1.setSizeBytes(file.getSize());
        v1.setUploadedBy(uploader != null ? uploader : fileItem.getUploadedBy());
        v1.setCreatedAt(Instant.now());
        v1 = fileVersionRepository.save(v1);

        fileItem.setCurrentVersionId(v1.getId());
        fileItem = fileItemRepository.save(fileItem);

        aiService.processAsync(fileItem.getId(), filePathS3);

        Map<String, Object> logPayload = new HashMap<>();
        logPayload.put("fileName", fileItem.getName() != null ? fileItem.getName() : "");
        logPayload.put("versionNo", 1);
        if (tags != null && !tags.isEmpty()) {
            logPayload.put("tags", tags);
        }

        activityLogManagementService.logActivity(
                company,
                uploader,
                ActivityType.UPLOAD,
                fileItem,
                logPayload
        );

        if (folder != null) {
            notificationWebSocketService.notifyFileUploadPermissions(fileItem, folder.getId(), uploader);
        }

        return toFileResponse(fileItem);
    }

    public List<TrashItemResponse> getTrash() {
        return fileItemRepository.findByDeletedAtIsNotNull()
                .stream()
                .map(this::toTrashResponse)
                .toList();
    }

    @Transactional
    public void softDelete(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !canUserModifyFile(file, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa tài liệu này");
        }

        file.setDeletedAt(Instant.now());
        fileItemRepository.save(file);

        activityLogManagementService.logActivity(
                file.getCompany(),
                currentUser != null ? currentUser : file.getUploadedBy(),
                ActivityType.DELETE,
                file,
                Map.of("fileName", file.getName() != null ? file.getName() : "", "softDelete", true)
        );
    }

    @Transactional
    public void restore(Long id) {
        FileItem file = getOrThrow(id);
        file.setDeletedAt(null);
        fileItemRepository.save(file);

        User currentUser = getAuthenticatedUser();
        activityLogManagementService.logActivity(
                file.getCompany(),
                currentUser != null ? currentUser : file.getUploadedBy(),
                ActivityType.UPDATE,
                file,
                Map.of("fileName", file.getName() != null ? file.getName() : "", "restore", true)
        );
    }

    @Transactional
    public void deletePermanently(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !canUserModifyFile(file, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa vĩnh viễn tài liệu này");
        }

        // 1. Ghi log trước khi xóa file (targetFile là null vì file sắp bị xóa)
        activityLogManagementService.logActivity(
                file.getCompany(),
                currentUser != null ? currentUser : file.getUploadedBy(),
                ActivityType.DELETE,
                null,
                Map.of("fileName", file.getName() != null ? file.getName() : "", "permanent", true)
        );

        // 2. Thu thập danh sách các file trên S3 cần xóa (file gốc, thumbnail, các phiên bản)
        Set<String> s3PathsToDelete = new HashSet<>();
        if (file.getStoragePath() != null && !file.getStoragePath().isBlank()) {
            s3PathsToDelete.add(file.getStoragePath());
        }
        if (file.getThumbnailPath() != null && !file.getThumbnailPath().isBlank()) {
            s3PathsToDelete.add(file.getThumbnailPath());
        }
        List<FileVersion> versions = fileVersionRepository.findByFile_IdOrderByVersionNoDesc(id);
        if (versions != null) {
            for (FileVersion v : versions) {
                if (v.getStoragePath() != null && !v.getStoragePath().isBlank()) {
                    s3PathsToDelete.add(v.getStoragePath());
                }
            }
        }

        // 3. Xóa các file tương ứng trên AWS S3
        for (String s3Path : s3PathsToDelete) {
            try {
                s3FileService.deleteFile(s3Path);
            } catch (Exception e) {
                log.warn("Không thể xóa file trên S3 ({}) cho document {}: {}", s3Path, id, e.getMessage());
            }
        }

        // 4. Xóa vector embedding trong Qdrant
        try {
            aiService.deleteDocument(id);
        } catch (Exception e) {
            log.warn("Không thể xóa vector Qdrant cho document {}: {}", id, e.getMessage());
        }

        // 5. Gỡ liên kết foreign key từ activity_logs sang file này để không vi phạm constraint
        activityLogRepository.detachTargetFile(id);

        // 6. Xóa các bản ghi citations trong lịch sử chat trỏ tới file này
        chatCitationRepository.deleteByFileId(id);

        // 7. Xóa các bản ghi đánh dấu sao trỏ tới file này
        userStarredFileRepository.deleteByFileId(id);

        // 7.5. Xóa các bản ghi yêu cầu quyền truy cập (access_requests) trỏ tới file này
        try {
            accessRequestRepository.deleteByFileId(id);
        } catch (Exception e) {
            log.warn("Không thể xóa access_requests cho document {}: {}", id, e.getMessage());
        }

        // 8. Xóa các bản ghi chunks trong bảng document_chunks
        try {
            documentChunkRepository.deleteByFileId(id);
        } catch (Exception e) {
            log.warn("Không thể xóa document_chunks cho document {}: {}", id, e.getMessage());
        }

        // 9. Xóa vĩnh viễn fileItem (JPA sẽ cascade xóa versions, permissions, tags, chunks)
        fileItemRepository.delete(file);
    }

    @Transactional
    public void deletePermanentlyBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        for (Long id : ids) {
            try {
                deletePermanently(id);
            } catch (Exception e) {
                log.warn("Failed to permanently delete file {}: {}", id, e.getMessage());
            }
        }
    }

    @Transactional
    public void restoreBatch(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;
        for (Long id : ids) {
            try {
                restore(id);
            } catch (Exception e) {
                log.warn("Failed to restore file {}: {}", id, e.getMessage());
            }
        }
    }

    @Transactional
    public FileItemResponse moveFile(Long fileId, Long targetFolderId) {
        FileItem file = getOrThrow(fileId);
        User currentUser = getAuthenticatedUser();

        // 1. Quyền trên file nguồn: User phải là Owner, Admin hoặc Editor được phân quyền trực tiếp
        if (currentUser != null && !canUserMoveFile(file, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền di chuyển tài liệu \"" + file.getName() + "\" do bạn không phải là người tạo file và không có quyền chỉnh sửa!");
        }

        // 2. Quyền trên thư mục đích
        Folder targetFolder = null;
        if (targetFolderId != null) {
            targetFolder = folderRepository.findById(targetFolderId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục đích không tồn tại"));

            if (currentUser != null && !folderService.canUploadToFolder(currentUser, targetFolder)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Bạn không có quyền tải lên hoặc chuyển file vào thư mục \"" + targetFolder.getName() + "\"");
            }
        }

        Folder oldFolder = file.getFolder();
        Long oldFolderId = oldFolder != null ? oldFolder.getId() : null;

        // Nếu file đã ở sẵn trong thư mục đích -> trả về ngay
        if (Objects.equals(oldFolderId, targetFolderId)) {
            return toFileResponse(file);
        }

        file.setFolder(targetFolder);
        file.setUpdatedAt(Instant.now());
        FileItem saved = fileItemRepository.save(file);

        String fromName = oldFolder != null ? oldFolder.getName() : "Kho tri thức chung";
        String toName = targetFolder != null ? targetFolder.getName() : "Kho tri thức chung";

        activityLogManagementService.logActivity(
                file.getCompany(),
                currentUser != null ? currentUser : file.getUploadedBy(),
                ActivityType.UPDATE,
                saved,
                Map.of(
                        "action", "MOVE_FILE",
                        "fromFolder", fromName,
                        "toFolder", toName,
                        "fileName", file.getName() != null ? file.getName() : ""
                )
        );

        return toFileResponse(saved);
    }

    @Transactional
    public List<FileItemResponse> moveFilesBatch(List<Long> fileIds, Long targetFolderId) {
        if (fileIds == null || fileIds.isEmpty()) {
            return List.of();
        }
        List<FileItemResponse> results = new ArrayList<>();
        for (Long id : fileIds) {
            results.add(moveFile(id, targetFolderId));
        }
        return results;
    }

    @Transactional
    public FileItemResponse renameFile(Long fileId, String newName) {
        if (newName == null || newName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên file không được để trống");
        }
        FileItem file = getOrThrow(fileId);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !canUserModifyFile(file, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền đổi tên tài liệu này");
        }
        String oldName = file.getName();
        file.setName(newName.trim());
        file.setUpdatedAt(Instant.now());
        FileItem saved = fileItemRepository.save(file);

        activityLogManagementService.logActivity(
                file.getCompany(),
                currentUser != null ? currentUser : file.getUploadedBy(),
                ActivityType.UPDATE,
                saved,
                Map.of("action", "RENAME_FILE", "oldName", oldName != null ? oldName : "", "newName", newName.trim())
        );

        return toFileResponse(saved);
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

    private FileItem getOrThrow(Long id) {
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
        List<String> tags = (f.getTags() != null)
                ? f.getTags().stream().map(FileTag::getTag).filter(Objects::nonNull).distinct().toList()
                : List.of();

        return new FileItemResponse(
                f.getId(),
                f.getName(),
                f.getFileType(),
                ownerName,
                uploaderName,
                uploaderEmail,
                updatedAt,
                size,
                f.getFolder() != null ? f.getFolder().getId() : null,
                f.getFolder() != null ? f.getFolder().getName() : null,
                f.isAiIndexed(),
                f.getStoragePath(),
                f.getVisibility() != null ? f.getVisibility().name() : "INHERIT",
                tags,
                f.getThumbnailPath()
        );
    }

    public ResponseEntity<byte[]> getThumbnail(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem tài liệu này");
        }

        if (file.getThumbnailPath() == null || file.getThumbnailPath().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có ảnh thumbnail cho tài liệu này");
        }

        try {
            byte[] bytes = s3FileService.downloadFile(file.getThumbnailPath());
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(bytes);
        } catch (Exception e) {
            log.warn("Cannot download thumbnail for file {}: {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh thumbnail");
        }
    }

    @Transactional
    public void saveThumbnail(Long id, MultipartFile thumbnail) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !canUserModifyFile(file, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền cập nhật tài liệu này");
        }

        if (thumbnail == null || thumbnail.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thumbnail không được để trống");
        }

        try {
            String thumbPath = s3FileService.uploadThumbnail(thumbnail);
            file.setThumbnailPath(thumbPath);
            fileItemRepository.save(file);
        } catch (Exception e) {
            log.error("Failed to save thumbnail for file {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Lưu thumbnail thất bại", e);
        }
    }

    @Transactional
    public FileItemResponse updateFileTags(Long id, List<String> tags) {
        FileItem file = getOrThrow(id);
        file.getTags().clear();
        if (tags != null) {
            for (String t : tags) {
                if (t != null && !t.isBlank()) {
                    FileTag ft = new FileTag();
                    ft.setFile(file);
                    ft.setTag(t.trim());
                    file.getTags().add(ft);
                }
            }
        }
        FileItem saved = fileItemRepository.save(file);
        activityLogManagementService.logActivity(
                file.getCompany(),
                getAuthenticatedUser(),
                ActivityType.UPDATE,
                file,
                Map.of("action", "UPDATE_TAGS", "tags", tags != null ? tags : List.of())
        );
        return toFileResponse(saved);
    }

    public List<String> getAllTags() {
        return fileItemRepository.findDistinctTags();
    }

    @Transactional
    public FileItemResponse updateVisibility(Long id, String visibilityStr) {
        FileItem file = getOrThrow(id);
        try {
            FileVisibility vis = FileVisibility.valueOf(visibilityStr.toUpperCase());
            file.setVisibility(vis);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid visibility value: " + visibilityStr);
        }
        file = fileItemRepository.save(file);
        activityLogManagementService.logActivity(
                file.getCompany(),
                getAuthenticatedUser(),
                ActivityType.UPDATE,
                file,
                Map.of("action", "UPDATE_VISIBILITY", "newVisibility", file.getVisibility().name())
        );
        return toFileResponse(file);
    }

    public Map<String, String> getPreviewUrl(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem tài liệu này");
        }

        String presignedUrl = null;
        if (file.getStoragePath() != null && !file.getStoragePath().isBlank()) {
            presignedUrl = s3FileService.generatePresignedUrl(file.getStoragePath(), java.time.Duration.ofMinutes(30));
        }

        String finalUrl = (presignedUrl != null && !presignedUrl.isBlank())
                ? presignedUrl
                : "http://localhost:8080/api/v1/files/" + id + "/stream";

        return Map.of(
                "url", finalUrl,
                "fileType", file.getFileType() != null ? file.getFileType().toLowerCase() : "pdf",
                "fileName", file.getName() != null ? file.getName() : "document"
        );
    }

    public ResponseEntity<byte[]> streamFile(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem hoặc tải tài liệu này");
        }

        if (file.getStoragePath() == null || file.getStoragePath().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có bản xem trước cho file này trên storage");
        }
        try {
            byte[] bytes = s3FileService.downloadFile(file.getStoragePath());
            String contentType = "application/octet-stream";
            String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "";
            if ("pdf".equals(ext)) contentType = "application/pdf";
            else if ("png".equals(ext)) contentType = "image/png";
            else if ("jpg".equals(ext) || "jpeg".equals(ext)) contentType = "image/jpeg";
            else if ("docx".equals(ext)) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if ("xlsx".equals(ext)) contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            ContentDisposition contentDisposition = ContentDisposition.inline()
                    .filename(file.getName() != null ? file.getName() : "document", StandardCharsets.UTF_8)
                    .build();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(bytes);
        } catch (Exception e) {
            log.warn("Cannot stream file {} from S3: {}", id, e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File chưa sẵn sàng hoặc không tìm thấy trên kho lưu trữ");
        }
    }

    @Transactional
    public FileItemResponse uploadNewVersion(Long fileId, MultipartFile file) {
        FileItem fileItem = getOrThrow(fileId);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !canUserModifyFile(fileItem, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền tải phiên bản mới cho tài liệu này");
        }

        String filePathS3;
        try {
            filePathS3 = s3FileService.uploadFile(file);
        } catch (Exception e) {
            log.error("Upload new version to S3 failed: {}", e.getMessage(), e);
            throw new RuntimeException("Upload new version to S3 failed", e);
        }

        int nextVersionNo = fileVersionRepository.findTopByFile_IdOrderByVersionNoDesc(fileId)
                .map(v -> v.getVersionNo() + 1)
                .orElse(2);

        // Đảm bảo nếu chưa có bản ghi version 1 trước đây thì tạo bù bản ghi v1
        if (nextVersionNo == 2 && fileVersionRepository.findByFile_IdOrderByVersionNoDesc(fileId).isEmpty()) {
            FileVersion v1 = new FileVersion();
            v1.setFile(fileItem);
            v1.setVersionNo(1);
            v1.setStoragePath(fileItem.getStoragePath() != null ? fileItem.getStoragePath() : filePathS3);
            v1.setSizeBytes(fileItem.getSizeBytes() != null ? fileItem.getSizeBytes() : file.getSize());
            v1.setUploadedBy(fileItem.getUploadedBy() != null ? fileItem.getUploadedBy() : (currentUser != null ? currentUser : userRepository.findAll().get(0)));
            v1.setCreatedAt(fileItem.getCreatedAt());
            fileVersionRepository.save(v1);
        }

        FileVersion newVersion = new FileVersion();
        newVersion.setFile(fileItem);
        newVersion.setVersionNo(nextVersionNo);
        newVersion.setStoragePath(filePathS3);
        newVersion.setSizeBytes(file.getSize());
        newVersion.setUploadedBy(currentUser != null ? currentUser : fileItem.getUploadedBy());
        newVersion.setCreatedAt(Instant.now());
        newVersion = fileVersionRepository.save(newVersion);

        fileItem.setStoragePath(filePathS3);
        fileItem.setSizeBytes(file.getSize());
        fileItem.setCurrentVersionId(newVersion.getId());
        fileItem.setUpdatedAt(Instant.now());
        fileItem = fileItemRepository.save(fileItem);

        // Kích hoạt lại AI async indexing cho nội dung phiên bản mới
        aiService.processAsync(fileItem.getId(), filePathS3);

        activityLogManagementService.logActivity(
                fileItem.getCompany(),
                currentUser != null ? currentUser : fileItem.getUploadedBy(),
                ActivityType.UPDATE,
                fileItem,
                Map.of("action", "UPLOAD_NEW_VERSION", "versionNo", nextVersionNo, "fileName", fileItem.getName())
        );

        return toFileResponse(fileItem);
    }

    @Transactional(readOnly = true)
    public List<FileVersionResponse> getFileVersions(Long fileId) {
        FileItem fileItem = getOrThrow(fileId);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(fileItem, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem tài liệu này");
        }

        List<FileVersion> list = fileVersionRepository.findByFile_IdOrderByVersionNoDesc(fileId);
        if (list.isEmpty()) {
            String uploaderName = fileItem.getUploadedBy() != null ? fileItem.getUploadedBy().getName() : "Người dùng";
            String uploaderEmail = fileItem.getUploadedBy() != null ? fileItem.getUploadedBy().getEmail() : "";
            return List.of(new FileVersionResponse(
                    fileItem.getId(),
                    fileItem.getId(),
                    1,
                    fileItem.getStoragePath(),
                    fileItem.getSizeBytes(),
                    formatBytes(fileItem.getSizeBytes()),
                    uploaderName,
                    uploaderEmail,
                    FMT.format(fileItem.getCreatedAt()),
                    true
            ));
        }

        int maxVersion = list.stream().mapToInt(FileVersion::getVersionNo).max().orElse(1);

        return list.stream().map(v -> {
            String uploaderName = v.getUploadedBy() != null ? v.getUploadedBy().getName() : "Người dùng";
            String uploaderEmail = v.getUploadedBy() != null ? v.getUploadedBy().getEmail() : "";
            boolean isCurrent = Objects.equals(v.getId(), fileItem.getCurrentVersionId())
                    || (fileItem.getCurrentVersionId() == null && v.getVersionNo() == maxVersion);
            return new FileVersionResponse(
                    v.getId(),
                    fileItem.getId(),
                    v.getVersionNo(),
                    v.getStoragePath(),
                    v.getSizeBytes(),
                    formatBytes(v.getSizeBytes()),
                    uploaderName,
                    uploaderEmail,
                    FMT.format(v.getCreatedAt()),
                    isCurrent
            );
        }).toList();
    }

    public ResponseEntity<byte[]> streamVersion(Long fileId, Long versionId) {
        FileItem file = getOrThrow(fileId);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài liệu này");
        }

        FileVersion version = fileVersionRepository.findByFile_IdAndId(fileId, versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phiên bản không tồn tại"));

        try {
            byte[] bytes = s3FileService.downloadFile(version.getStoragePath());
            String contentType = "application/octet-stream";
            String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "";
            if ("pdf".equals(ext)) contentType = "application/pdf";
            else if ("png".equals(ext)) contentType = "image/png";
            else if ("jpg".equals(ext) || "jpeg".equals(ext)) contentType = "image/jpeg";
            else if ("docx".equals(ext)) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if ("xlsx".equals(ext)) contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            String versionFileName = "v" + version.getVersionNo() + "_" + (file.getName() != null ? file.getName() : "document");
            ContentDisposition contentDisposition = ContentDisposition.inline()
                    .filename(versionFileName, StandardCharsets.UTF_8)
                    .build();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(bytes);
        } catch (Exception e) {
            log.warn("Cannot stream version {} for file {}: {}", versionId, fileId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Phiên bản file chưa sẵn sàng trên kho lưu trữ");
        }
    }

    public String getFileText(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem tài liệu này");
        }

        String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "";
        if ("txt".equals(ext) || "md".equals(ext) || "json".equals(ext) || "csv".equals(ext) || "html".equals(ext)) {
            if (file.getStoragePath() != null && !file.getStoragePath().isBlank()) {
                try {
                    byte[] bytes = s3FileService.downloadFile(file.getStoragePath());
                    return new String(bytes, StandardCharsets.UTF_8);
                } catch (Exception e) {
                    log.warn("Cannot download raw text from S3 for file {}: {}", id, e.getMessage());
                }
            }
        }

        // 1. Kiểm tra nhanh trong document_chunks (nếu tài liệu đã được index AI, trả về ngay < 5ms)
        try {
            List<DocumentChunk> chunks = documentChunkRepository.findByFile_IdOrderByChunkIndexAsc(id);
            if (chunks != null && !chunks.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (DocumentChunk chunk : chunks) {
                    if (chunk.getContent() != null && !chunk.getContent().isBlank()) {
                        if (sb.length() > 0) sb.append("\n\n");
                        sb.append(chunk.getContent().trim());
                    }
                }
                if (sb.length() > 0) {
                    return sb.toString();
                }
            }
        } catch (Exception e) {
            log.warn("Cannot fetch chunks from document_chunks for file {}: {}", id, e.getMessage());
        }

        // 2. Với file DOCX: đọc trực tiếp XML nội dung từ file S3 bằng ZipInputStream tích hợp sẵn của Java (siêu nhanh < 50ms)
        if ("docx".equals(ext) && file.getStoragePath() != null && !file.getStoragePath().isBlank()) {
            try {
                byte[] bytes = s3FileService.downloadFile(file.getStoragePath());
                String docxText = extractDocxText(bytes);
                if (docxText != null && !docxText.isBlank()) {
                    return docxText;
                }
            } catch (Exception e) {
                log.warn("Cannot extract DOCX text directly for file {}: {}", id, e.getMessage());
            }
        }

        // 3. Với các file khác: gọi AI Service extract (nếu có)
        try {
            if (file.getStoragePath() != null && !file.getStoragePath().isBlank()) {
                long docNumericId = id != null ? id : 0L;
                ExtractResponse extractRes = aiServiceClient.extract(
                        ExtractRequest.builder()
                                .documentId(docNumericId)
                                .filePath(file.getStoragePath())
                                .build()
                );
                if (extractRes != null && extractRes.getOcrText() != null && !extractRes.getOcrText().isBlank()) {
                    return extractRes.getOcrText();
                }
            }
        } catch (Exception e) {
            log.warn("AI extraction text fallback for file {}: {}", id, e.getMessage());
        }

        // 4. Fallback: sinh mẫu tài liệu có cấu trúc từ metadata của file
        return "# " + (file.getName() != null ? file.getName() : "Tài liệu nội bộ") + "\n\n"
                + "## 1. Thông tin chung\n"
                + "- Phòng ban quản lý: " + (file.getOwnerDepartment() != null ? file.getOwnerDepartment().getName() : "Chưa xác định") + "\n"
                + "- Định dạng: " + ext.toUpperCase() + "\n"
                + "- Cập nhật lần cuối: " + FMT.format(file.getUpdatedAt()) + "\n\n"
                + "## 2. Nội dung chi tiết\n"
                + "[Nhập nội dung chỉnh sửa hoặc bổ sung điều khoản cho tài liệu tại đây...]\n";
    }

    private String extractDocxText(byte[] docxBytes) {
        if (docxBytes == null || docxBytes.length == 0) return null;
        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(docxBytes))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if ("word/document.xml".equals(entry.getName())) {
                    String xml = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                    xml = xml.replaceAll("</w:p>", "\n");
                    xml = xml.replaceAll("</w:tr>", "\n");
                    String text = xml.replaceAll("<[^>]+>", " ");
                    return text.replaceAll("[ \t]+", " ")
                               .replaceAll("(?m)^[ \t]*\r?\n", "")
                               .trim();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract DOCX text via ZipInputStream: {}", e.getMessage());
        }
        return null;
    }

    @Transactional
    public FileItemResponse saveTextVersion(Long id, String content) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !canUserModifyFile(file, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền chỉnh sửa tài liệu này");
        }

        String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "txt";
        String mimeType = "text/plain";
        if ("md".equals(ext)) mimeType = "text/markdown";
        else if ("html".equals(ext)) mimeType = "text/html";
        else if ("json".equals(ext)) mimeType = "application/json";

        byte[] bytes = (content != null ? content : "").getBytes(StandardCharsets.UTF_8);
        String originalFilename = file.getName();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "document." + ext;
        }

        InMemoryMultipartFile multipartFile = new InMemoryMultipartFile(bytes, originalFilename, mimeType);
        return uploadNewVersion(id, multipartFile);
    }

    private TrashItemResponse toTrashResponse(FileItem f) {
        String deletedBy = f.getUploadedBy() != null ? f.getUploadedBy().getName() : "";
        String deletedAt = f.getDeletedAt() != null ? FMT.format(f.getDeletedAt()) : "";
        Long folderId = f.getFolder() != null ? f.getFolder().getId() : null;
        String folderName = f.getFolder() != null ? f.getFolder().getName() : null;
        String originalLocation = (f.getFolder() != null && f.getFolder().getName() != null)
                ? f.getFolder().getName()
                : "Drive của tôi";
        String owner = f.getUploadedBy() != null ? f.getUploadedBy().getName() : "tôi";
        String thumb = f.getThumbnailPath();

        return new TrashItemResponse(
                f.getId(),
                f.getName(),
                f.getFileType(),
                deletedBy,
                deletedAt,
                formatBytes(f.getSizeBytes()),
                folderId,
                folderName,
                originalLocation,
                owner,
                thumb
        );
    }

    private String formatBytes(Long bytes) {
        if (bytes == null) return "0 KB";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.0f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }

    /** Lấy danh sách phân quyền của file */
    @Transactional(readOnly = true)
    public List<FilePermissionResponse> getPermissions(Long fileId) {
        List<FilePermission> list = filePermissionRepository.findByFileId(fileId);
        return list.stream().map(this::toPermissionResponse).toList();
    }

    /** Cập nhật phân quyền cho file (lưu trực tiếp vào CSDL) */
    @Transactional
    public List<FilePermissionResponse> updatePermissions(Long fileId, FilePermissionUpdateRequest request) {
        FileItem file = getOrThrow(fileId);

        if (request != null && request.visibility() != null && !request.visibility().isBlank()) {
            try {
                file.setVisibility(FileVisibility.valueOf(request.visibility().trim().toUpperCase()));
                fileItemRepository.save(file);
            } catch (IllegalArgumentException ignored) {}
        }

        filePermissionRepository.deleteByFileIdDirect(fileId);
        filePermissionRepository.flush();

        if (request != null && request.permissions() != null) {
            Set<String> seen = new HashSet<>();
            List<FilePermission> toSave = new ArrayList<>();
            User currentUser = getAuthenticatedUser();

            for (FilePermissionUpdateRequest.FilePermissionItemRequest item : request.permissions()) {
                if (item.subjectId() == null) continue;
                PermissionSubjectType sType = item.subjectType() != null ? item.subjectType() : PermissionSubjectType.DEPARTMENT;
                String key = sType + ":" + item.subjectId();
                if (seen.contains(key)) continue;
                seen.add(key);

                FilePermission perm = new FilePermission();
                perm.setFile(file);
                perm.setSubjectType(sType);
                perm.setSubjectId(item.subjectId());
                perm.setLevel(item.level() != null ? item.level() : PermissionLevel.VIEWER);
                perm.setGrantedBy(currentUser);
                toSave.add(perm);
            }
            if (!toSave.isEmpty()) {
                filePermissionRepository.saveAll(toSave);
                filePermissionRepository.flush();
            }
        }

        return getPermissions(fileId);
    }

    private FilePermissionResponse toPermissionResponse(FilePermission p) {
        String name = "Không xác định";
        String detail = "";

        if (p.getSubjectType() == PermissionSubjectType.DEPARTMENT) {
            Department dept = departmentRepository.findById(p.getSubjectId()).orElse(null);
            if (dept != null) {
                name = dept.getName();
                detail = "Phòng ban";
            }
        } else if (p.getSubjectType() == PermissionSubjectType.USER) {
            User u = userRepository.findById(p.getSubjectId()).orElse(null);
            if (u != null) {
                name = u.getName() != null ? u.getName() : u.getEmail();
                detail = u.getEmail();
            }
        }

        return new FilePermissionResponse(
                p.getId(),
                p.getFile().getId(),
                p.getSubjectType(),
                p.getSubjectId(),
                name,
                detail,
                p.getLevel(),
                p.getCreatedAt()
        );
    }

    public boolean hasFileAccess(FileItem file, User user, PermissionLevel requiredLevel) {
        if (file == null) return false;
        if (user == null) return true; // Nếu chưa có user (development/anonymous), mặc định cho phép để tránh crash
        if (user.getRole() == UserRole.ADMIN) return true;

        // Người tải lên là OWNER -> toàn quyền
        if (file.getUploadedBy() != null && file.getUploadedBy().getId().equals(user.getId())) {
            return true;
        }

        FileVisibility visibility = file.getVisibility() != null ? file.getVisibility() : FileVisibility.INHERIT;

        // PRIVATE: chỉ duy nhất người tải lên hoặc ADMIN
        if (visibility == FileVisibility.PRIVATE) {
            return false;
        }

        // COMPANY: mọi người cùng công ty đều có quyền xem (VIEWER)
        if (visibility == FileVisibility.COMPANY) {
            if (requiredLevel == PermissionLevel.VIEWER) {
                return true;
            }
            if (file.getOwnerDepartment() != null && user.getDepartment() != null
                    && file.getOwnerDepartment().getId().equals(user.getDepartment().getId())) {
                return true;
            }
        }

        // Kiểm tra phân quyền trực tiếp trên file (FilePermission)
        List<FilePermission> permissions = filePermissionRepository.findByFileId(file.getId());
        for (FilePermission p : permissions) {
            if (p.getSubjectType() == PermissionSubjectType.USER && p.getSubjectId().equals(user.getId())) {
                return checkLevel(p.getLevel(), requiredLevel);
            }
            if (p.getSubjectType() == PermissionSubjectType.DEPARTMENT && user.getDepartment() != null
                    && p.getSubjectId().equals(user.getDepartment().getId())) {
                return checkLevel(p.getLevel(), requiredLevel);
            }
        }

        // Kế thừa phân quyền từ thư mục cha nếu file đặt chế độ INHERIT
        if (visibility == FileVisibility.INHERIT && file.getFolder() != null) {
            Folder folder = file.getFolder();
            if (folder.getDefaultDepartment() != null && user.getDepartment() != null
                    && folder.getDefaultDepartment().getId().equals(user.getDepartment().getId())) {
                return true;
            }
            List<FolderPermission> folderPermissions = folderPermissionRepository.findByFolderId(folder.getId());
            for (FolderPermission fp : folderPermissions) {
                if (fp.getSubjectType() == PermissionSubjectType.USER && fp.getSubjectId().equals(user.getId())) {
                    return checkLevel(fp.getLevel(), requiredLevel);
                }
                if (fp.getSubjectType() == PermissionSubjectType.DEPARTMENT && user.getDepartment() != null
                        && fp.getSubjectId().equals(user.getDepartment().getId())) {
                    return checkLevel(fp.getLevel(), requiredLevel);
                }
            }
        }

        // Nếu cùng phòng ban sở hữu file thì cho phép xem
        if (file.getOwnerDepartment() != null && user.getDepartment() != null
                && file.getOwnerDepartment().getId().equals(user.getDepartment().getId())) {
            return true;
        }

        return false;
    }

    public boolean canUserModifyFile(FileItem file, User user) {
        return hasFileAccess(file, user, PermissionLevel.EDITOR);
    }

    /**
     * Kiểm tra xem User có quyền DI CHUYỂN file này không:
     * - Quản trị viên (ADMIN)
     * - Chính chủ người tải lên / sở hữu file (OWNER/Uploader)
     * - Người được cấp quyền EDITOR đích danh trực tiếp trên file
     * - Người tạo thư mục hoặc có quyền EDITOR trên thư mục nguồn chứa file
     * Nhân viên thông thường chỉ có quyền xem (VIEWER) hoặc cùng phòng ban TUYỆT ĐỐI không thể di chuyển file của người khác.
     */
    public boolean canUserMoveFile(FileItem file, User user) {
        if (file == null || user == null) return false;
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }

        // 1. Chính chủ người tải lên file
        if (file.getUploadedBy() != null && file.getUploadedBy().getId().equals(user.getId())) {
            return true;
        }

        // 2. Quyền EDITOR trực tiếp trên file được gán đích danh cho User
        List<FilePermission> permissions = filePermissionRepository.findByFileId(file.getId());
        boolean hasDirectUserEditor = permissions.stream().anyMatch(p ->
                p.getSubjectType() == PermissionSubjectType.USER
                && user.getId().equals(p.getSubjectId())
                && p.getLevel() == PermissionLevel.EDITOR
        );
        if (hasDirectUserEditor) {
            return true;
        }

        // 3. Quyền quản lý trên thư mục nguồn chứa file
        if (file.getFolder() != null && folderService.canUploadToFolder(user, file.getFolder())) {
            return true;
        }

        return false;
    }

    private boolean checkLevel(PermissionLevel actual, PermissionLevel required) {
        if (actual == null) return false;
        if (required == PermissionLevel.VIEWER) return true;
        return actual == PermissionLevel.EDITOR;
    }
}
