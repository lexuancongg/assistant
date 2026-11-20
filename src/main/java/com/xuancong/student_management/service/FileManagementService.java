package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.file.FileItemResponse;
import com.xuancong.student_management.dto.file.FilePermissionResponse;
import com.xuancong.student_management.dto.file.FilePermissionUpdateRequest;
import com.xuancong.student_management.dto.file.FileVersionResponse;
import com.xuancong.student_management.dto.file.TrashItemResponse;
import com.xuancong.student_management.entity.ActivityLog;
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
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

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
    private final DownloadTokenService downloadTokenService;
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
    public static class PendingSaveOption {
        private final com.xuancong.student_management.dto.file.OnlyOfficeSaveOptionsRequest request;
        private final User user;
        public PendingSaveOption(com.xuancong.student_management.dto.file.OnlyOfficeSaveOptionsRequest request, User user) {
            this.request = request;
            this.user = user;
        }
        public com.xuancong.student_management.dto.file.OnlyOfficeSaveOptionsRequest getRequest() { return request; }
        public User getUser() { return user; }
    }
    private final java.util.concurrent.ConcurrentHashMap<Long, PendingSaveOption> pendingSaveOptions = new java.util.concurrent.ConcurrentHashMap<>();

    @org.springframework.beans.factory.annotation.Value("${onlyoffice.url:http://localhost:8083}")
    private String onlyOfficeUrl;

    @org.springframework.beans.factory.annotation.Value("${onlyoffice.jwt-secret:onlyoffice_jwt_secret_key_2026_assistant}")
    private String onlyOfficeJwtSecret;

    @org.springframework.beans.factory.annotation.Value("${onlyoffice.internal-callback-url:http://host.docker.internal:8080}")
    private String onlyOfficeInternalCallbackUrl;

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

        List<Folder> allFolders = folderRepository.findAll();
        Set<Long> visibleFolderIds = folderService.getVisibleFolderIds(currentUser, allFolders);

        return fileItemRepository.findByDeletedAtIsNull()
                .stream()
                .filter(f -> {
                    // 1. Loại bỏ các tệp do chính user hiện tại tải lên
                    if (f.getUploadedBy() != null && f.getUploadedBy().getId().equals(currentUser.getId())) {
                        return false;
                    }

                    // 2. Phải có quyền xem trở lên
                    if (!hasFileAccess(f, currentUser, PermissionLevel.VIEWER)) {
                        return false;
                    }

                    // 3. Nếu tệp này nằm trong một thư mục mà user ĐÃ THẤY trên cây thư mục Drive của mình
                    // (Ví dụ: thư mục RTW thuộc bộ phận của user, hoặc thư mục đã được hiển thị theo cấu trúc thư mục tới file đó),
                    // thì tệp này thuộc về cây thư mục đó trong "Drive của tôi", KHÔNG ĐƯỢC nằm ở "Được chia sẻ với tôi".
                    if (f.getFolder() != null && visibleFolderIds.contains(f.getFolder().getId())) {
                        return false;
                    }

                    // 4. Các trường hợp:
                    // - File không nằm trong thư mục nào (folderId == null) được chia sẻ cho user
                    // - File nằm trong thư mục mà user KHÔNG được xem cấu trúc thư mục (như file sao chép link về xin quyền, file chia sẻ qua link)
                    // => BẮT BUỘC nằm ở mục "Được chia sẻ với tôi"!
                    return true;
                })
                .map(this::toFileResponse)
                .toList();
    }

        public java.util.Map<String, Object> getFilePublicInfo(Long id) {
        FileItem file = getOrThrow(id);
        java.util.Map<String, Object> info = new java.util.HashMap<>();
        info.put("id", file.getId());
        info.put("name", file.getName());
        info.put("fileType", file.getFileType());
        if (file.getFolder() != null) {
            info.put("folderId", file.getFolder().getId());
            info.put("folderName", file.getFolder().getName());
        }
        return info;
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
            if (folder != null && uploader != null && !folderService.canUploadToFolder(uploader, folder)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Bạn không có quyền tải tệp tin lên thư mục \"" + folder.getName() + "\"!");
            }
        }

        Department ownerDept = (uploader != null) ? uploader.getDepartment() : null;
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename().trim() : "document.pdf";
        String ext = extractExtension(originalFilename);

        // Kiểm tra trùng tên file trong cùng một thư mục cha
        Long companyId = company != null ? company.getId() : null;
        if (companyId != null) {
            boolean duplicate = (folder != null)
                    ? fileItemRepository.existsByCompanyIdAndFolderIdAndNameIgnoreCaseAndDeletedAtIsNull(companyId, folder.getId(), originalFilename)
                    : fileItemRepository.existsByCompanyIdAndFolderIsNullAndNameIgnoreCaseAndDeletedAtIsNull(companyId, originalFilename);
            if (duplicate) {
                String folderDesc = folder != null ? "thư mục \"" + folder.getName() + "\"" : "thư mục gốc (Drive của tôi)";
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Tệp tin \"" + originalFilename + "\" đã tồn tại trong " + folderDesc + ". Vui lòng đổi tên file hoặc tải lên phiên bản mới.");
            }
        }

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
        String trimmedName = newName.trim();
        if (!trimmedName.equalsIgnoreCase(oldName)) {
            Long companyId = file.getCompany() != null ? file.getCompany().getId() : null;
            if (companyId != null) {
                Long fId = file.getFolder() != null ? file.getFolder().getId() : null;
                boolean duplicate = (fId != null)
                        ? fileItemRepository.existsByCompanyIdAndFolderIdAndNameIgnoreCaseAndDeletedAtIsNull(companyId, fId, trimmedName)
                        : fileItemRepository.existsByCompanyIdAndFolderIsNullAndNameIgnoreCaseAndDeletedAtIsNull(companyId, trimmedName);
                if (duplicate) {
                    String folderDesc = file.getFolder() != null ? "thư mục \"" + file.getFolder().getName() + "\"" : "thư mục gốc (Drive của tôi)";
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Tệp tin \"" + trimmedName + "\" đã tồn tại trong " + folderDesc + ".");
                }
            }
        }
        file.setName(trimmedName);
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

        String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "";
        String resContentType = null;
        if ("md".equals(ext) || "markdown".equals(ext)) resContentType = "text/markdown; charset=UTF-8";
        else if ("txt".equals(ext)) resContentType = "text/plain; charset=UTF-8";
        else if ("json".equals(ext)) resContentType = "application/json; charset=UTF-8";
        else if ("pdf".equals(ext)) resContentType = "application/pdf";

        String presignedUrl = null;
        if (file.getStoragePath() != null && !file.getStoragePath().isBlank()) {
            presignedUrl = s3FileService.generatePresignedUrl(file.getStoragePath(), java.time.Duration.ofMinutes(30), resContentType);
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

    public ResponseEntity<?> streamFile(Long id) {
        return streamFile(id, null);
    }

    public ResponseEntity<?> streamFile(Long id, String rangeHeader) {
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
            else if ("md".equals(ext) || "markdown".equals(ext)) contentType = "text/markdown; charset=UTF-8";
            else if ("txt".equals(ext)) contentType = "text/plain; charset=UTF-8";
            else if ("json".equals(ext)) contentType = "application/json; charset=UTF-8";

            ContentDisposition contentDisposition = ContentDisposition.inline()
                    .filename(file.getName() != null ? file.getName() : "document", StandardCharsets.UTF_8)
                    .build();

            long totalLength = bytes.length;
            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                String[] ranges = rangeHeader.substring(6).split("-");
                long start = Long.parseLong(ranges[0]);
                long end = ranges.length > 1 && !ranges[1].isBlank() ? Long.parseLong(ranges[1]) : totalLength - 1;
                if (start <= end && end < totalLength) {
                    int rangeLength = (int) (end - start + 1);
                    byte[] rangeBytes = new byte[rangeLength];
                    System.arraycopy(bytes, (int) start, rangeBytes, 0, rangeLength);
                    return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                            .contentType(MediaType.parseMediaType(contentType))
                            .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                            .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + totalLength)
                            .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(rangeLength))
                            .body(rangeBytes);
                }
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(totalLength))
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
        FileItem file = getOrThrow(fileId);
        List<FilePermission> list = filePermissionRepository.findByFileId(fileId);
        if (list != null && !list.isEmpty()) {
            return list.stream().map(p -> toPermissionResponse(p, false, null)).toList();
        }

        // Nếu file đang ở chế độ INHERIT và nằm trong thư mục, kế thừa từ cây thư mục cha
        FileVisibility visibility = file.getVisibility() != null ? file.getVisibility() : FileVisibility.INHERIT;
        if (visibility == FileVisibility.INHERIT && file.getFolder() != null) {
            Folder curr = file.getFolder();
            while (curr != null) {
                List<FolderPermission> parentList = folderPermissionRepository.findByFolderId(curr.getId());
                if (parentList != null && !parentList.isEmpty()) {
                    final String parentName = curr.getName();
                    return parentList.stream().map(fp -> toFolderPermissionToFileResponse(fileId, fp, true, parentName)).toList();
                }
                curr = curr.getParent();
            }
        }

        return List.of();
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
        return toPermissionResponse(p, false, null);
    }

    private FilePermissionResponse toPermissionResponse(FilePermission p, boolean inherited, String inheritedFromName) {
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
                inherited,
                inheritedFromName,
                p.getCreatedAt()
        );
    }

    private FilePermissionResponse toFolderPermissionToFileResponse(Long fileId, FolderPermission fp, boolean inherited, String inheritedFromName) {
        String name = "Không xác định";
        String detail = "";

        if (fp.getSubjectType() == PermissionSubjectType.DEPARTMENT) {
            Department dept = departmentRepository.findById(fp.getSubjectId()).orElse(null);
            if (dept != null) {
                name = dept.getName();
                detail = "Phòng ban";
            }
        } else if (fp.getSubjectType() == PermissionSubjectType.USER) {
            User u = userRepository.findById(fp.getSubjectId()).orElse(null);
            if (u != null) {
                name = u.getName() != null ? u.getName() : u.getEmail();
                detail = u.getEmail();
            }
        }

        return new FilePermissionResponse(
                fp.getId(),
                fileId,
                fp.getSubjectType(),
                fp.getSubjectId(),
                name,
                detail,
                fp.getLevel(),
                inherited,
                inheritedFromName,
                fp.getCreatedAt()
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

        // Chủ sở hữu của thư mục chứa file (hoặc thư mục cha của nó) -> toàn quyền xem / quản lý file trong thư mục của mình
        if (file.getFolder() != null) {
            com.xuancong.student_management.entity.Folder currentFolder = file.getFolder();
            while (currentFolder != null) {
                if (currentFolder.getCreatedBy() != null && currentFolder.getCreatedBy().getId().equals(user.getId())) {
                    return true;
                }
                currentFolder = currentFolder.getParent();
            }
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

        // Kiểm tra phân quyền trực tiếp trên file (FilePermission) - Ưu tiên User trước Department
        List<FilePermission> permissions = filePermissionRepository.findByFileId(file.getId());
        java.util.Optional<FilePermission> userFilePerm = permissions.stream()
                .filter(p -> p.getSubjectType() == PermissionSubjectType.USER && p.getSubjectId().equals(user.getId()))
                .findFirst();
        if (userFilePerm.isPresent()) {
            return checkLevel(userFilePerm.get().getLevel(), requiredLevel);
        }
        if (user.getDepartment() != null) {
            java.util.Optional<FilePermission> deptFilePerm = permissions.stream()
                    .filter(p -> p.getSubjectType() == PermissionSubjectType.DEPARTMENT && p.getSubjectId().equals(user.getDepartment().getId()))
                    .findFirst();
            if (deptFilePerm.isPresent()) {
                return checkLevel(deptFilePerm.get().getLevel(), requiredLevel);
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

    
    private String buildContentDisposition(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "attachment; filename=\"download\"";
        }
        String cleanName = fileName.replace("\"", "").replace("\r", "").replace("\n", "");
        String asciiFallback = cleanName.replaceAll("[^\\x20-\\x7E]", "_");
        if (asciiFallback.isBlank()) {
            asciiFallback = "file";
        }
        String encodedUtf8 = java.net.URLEncoder.encode(cleanName, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
        return "attachment; filename=\"" + asciiFallback + "\"; filename*=UTF-8''" + encodedUtf8;
    }

    public Map<String, Object> createDownloadToken(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền tải tài liệu này");
        }

        String fileName = file.getName() != null ? file.getName() : "downloaded_file";
        String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "";

        String directDownloadUrl = null;
        if (file.getStoragePath() != null && !file.getStoragePath().isBlank()) {
            String disposition = buildContentDisposition(fileName);
            directDownloadUrl = s3FileService.generatePresignedUrl(
                    file.getStoragePath(),
                    java.time.Duration.ofMinutes(10),
                    null,
                    disposition
            );
        }

        String token = downloadTokenService.createToken(
                file.getId(),
                fileName,
                file.getStoragePath(),
                ext,
                directDownloadUrl
        );

        activityLogManagementService.logActivity(
                file.getCompany(),
                currentUser != null ? currentUser : file.getUploadedBy(),
                com.xuancong.student_management.entity.enums.ActivityType.DOWNLOAD,
                file,
                Map.of("fileName", fileName)
        );

        return Map.of(
                "token", token,
                "downloadUrl", "/api/v1/files/download?token=" + token,
                "directUrl", directDownloadUrl != null ? directDownloadUrl : "",
                "fileName", fileName
        );
    }

    public ResponseEntity<?> downloadByToken(String token) {
        DownloadTokenService.DownloadTicket ticket = downloadTokenService.validateToken(token);
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liên kết tải xuống không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
        }

        if (ticket.getDirectUrl() != null && !ticket.getDirectUrl().isBlank()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(java.net.URI.create(ticket.getDirectUrl()))
                    .build();
        }

        if (ticket.getStoragePath() == null || ticket.getStoragePath().isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nội dung tệp để tải");
        }

        try {
            byte[] bytes = s3FileService.downloadFile(ticket.getStoragePath());
            String safeName = ticket.getFileName() != null ? ticket.getFileName() : "file";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, buildContentDisposition(safeName))
                    .contentLength(bytes.length)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(bytes);
        } catch (Exception e) {
            log.error("Failed to download file by token: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi tải tệp từ storage");
        }
    }


    @Transactional
    public FileItemResponse copyFile(Long fileId) {
        FileItem original = getOrThrow(fileId);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(original, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền sao chép tài liệu này");
        }

        String baseName = original.getName();
        String ext = original.getFileType() != null ? original.getFileType() : "";
        Long companyId = original.getCompany() != null ? original.getCompany().getId() : null;
        Long folderId = original.getFolder() != null ? original.getFolder().getId() : null;
        String newName = generateCopyFileName(baseName, companyId, folderId);

        String newStoragePath = "";
        if (original.getStoragePath() != null && !original.getStoragePath().isBlank()) {
            String newKey = "docs/" + UUID.randomUUID() + (ext.isBlank() ? "" : "." + ext);
            try {
                newStoragePath = s3FileService.copyFile(original.getStoragePath(), newKey);
            } catch (Exception e) {
                log.error("Failed to copy S3 object for file {}: {}", fileId, e.getMessage());
                newStoragePath = original.getStoragePath();
            }
        }

        FileItem copy = new FileItem();
        copy.setName(newName);
        copy.setFileType(original.getFileType());
        copy.setSizeBytes(original.getSizeBytes());
        copy.setCompany(original.getCompany());
        copy.setFolder(original.getFolder());
        copy.setOwnerDepartment(original.getOwnerDepartment());
        copy.setUploadedBy(currentUser != null ? currentUser : original.getUploadedBy());
        copy.setVisibility(original.getVisibility());
        copy.setAiIndexed(false);
        copy.setThumbnailPath(original.getThumbnailPath());
        copy.setStoragePath(newStoragePath);
        copy.setCreatedAt(Instant.now());
        copy.setUpdatedAt(Instant.now());

        if (original.getTags() != null) {
            for (FileTag tag : original.getTags()) {
                FileTag newTag = new FileTag();
                newTag.setFile(copy);
                newTag.setTag(tag.getTag());
                copy.getTags().add(newTag);
            }
        }

        FileItem saved = fileItemRepository.save(copy);

        FileVersion v1 = new FileVersion();
        v1.setFile(saved);
        v1.setVersionNo(1);
        v1.setStoragePath(newStoragePath);
        v1.setSizeBytes(original.getSizeBytes());
        v1.setUploadedBy(currentUser != null ? currentUser : original.getUploadedBy());
        v1.setCreatedAt(Instant.now());
        v1 = fileVersionRepository.save(v1);

        saved.setCurrentVersionId(v1.getId());
        saved = fileItemRepository.save(saved);

        activityLogManagementService.logActivity(
                saved.getCompany(),
                currentUser != null ? currentUser : saved.getUploadedBy(),
                com.xuancong.student_management.entity.enums.ActivityType.UPLOAD,
                saved,
                Map.of("action", "COPY_FILE", "originalFileId", original.getId(), "fileName", saved.getName())
        );

        return toFileResponse(saved);
    }

    private String generateCopyFileName(String originalName, Long companyId, Long folderId) {
        String copyPrefix = "Bản sao của ";
        String candidate = copyPrefix + originalName;

        if (companyId == null) return candidate;

        if (!checkCopyFileExists(candidate, companyId, folderId)) {
            return candidate;
        }

        int count = 2;
        while (true) {
            candidate = "Bản sao (" + count + ") của " + originalName;
            if (!checkCopyFileExists(candidate, companyId, folderId)) {
                return candidate;
            }
            count++;
        }
    }

    private boolean checkCopyFileExists(String name, Long companyId, Long folderId) {
        if (folderId != null) {
            return fileItemRepository.existsByCompanyIdAndFolderIdAndNameIgnoreCaseAndDeletedAtIsNull(companyId, folderId, name);
        } else {
            return fileItemRepository.existsByCompanyIdAndFolderIsNullAndNameIgnoreCaseAndDeletedAtIsNull(companyId, name);
        }
    }


    private SecretKey getOnlyOfficeSigningKey() {
        byte[] keyBytes = onlyOfficeJwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            return Keys.hmacShaKeyFor(padded);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String createOnlyOfficeToken(Map<String, Object> payload) {
        try {
            return Jwts.builder()
                    .setClaims(payload)
                    .signWith(getOnlyOfficeSigningKey(), SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            log.error("Failed to generate ONLYOFFICE JWT token", e);
            return "";
        }
    }

    public Map<String, Object> getOnlyOfficeConfig(Long id) {
        FileItem file = getOrThrow(id);
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && !hasFileAccess(file, currentUser, PermissionLevel.VIEWER)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem tài liệu này");
        }

        boolean canEdit = currentUser == null || hasFileAccess(file, currentUser, PermissionLevel.EDITOR);

        String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "docx";
        String docType = "word";
        if (ext.matches("^(xlsx|xls|csv|ods)$")) {
            docType = "cell";
        } else if (ext.matches("^(pptx|ppt|odp)$")) {
            docType = "slide";
        }

        // Secure internal download token URL for ONLYOFFICE to fetch file without S3 header conflict
        String dlToken = downloadTokenService.createToken(file.getId(), file.getName(), file.getStoragePath(), ext, null);
        String downloadUrl = onlyOfficeInternalCallbackUrl + "/api/v1/files/download?token=" + dlToken;

        String key = "file_" + file.getId() + "_v" + (file.getCurrentVersionId() != null ? file.getCurrentVersionId() : (file.getUpdatedAt() != null ? file.getUpdatedAt().toEpochMilli() : System.currentTimeMillis()));

        Map<String, Object> permissions = new HashMap<>();
        permissions.put("edit", canEdit);
        permissions.put("download", true);
        permissions.put("print", true);
        permissions.put("review", canEdit);
        permissions.put("comment", canEdit);
        permissions.put("fillForms", true);
        permissions.put("modifyFilter", canEdit);
        permissions.put("modifyContentControl", canEdit);

        Map<String, Object> document = new HashMap<>();
        document.put("title", file.getName());
        document.put("url", downloadUrl);
        document.put("fileType", ext);
        document.put("key", key);
        document.put("permissions", permissions);

        Map<String, Object> user = new HashMap<>();
        user.put("id", currentUser != null ? currentUser.getId().toString() : "anonymous");
        user.put("name", "");

        Map<String, Object> headerLayout = new HashMap<>();
        headerLayout.put("user", false);
        headerLayout.put("users", false);

        Map<String, Object> layout = new HashMap<>();
        layout.put("header", headerLayout);

        Map<String, Object> customization = new HashMap<>();
        customization.put("autosave", true);
        customization.put("forcesave", true);
        customization.put("chat", false);
        customization.put("comments", true);
        customization.put("help", false);
        customization.put("feedback", false);
        customization.put("layout", layout);

        Map<String, Object> editorConfig = new HashMap<>();
        editorConfig.put("callbackUrl", onlyOfficeInternalCallbackUrl + "/api/v1/files/" + id + "/onlyoffice-callback");
        editorConfig.put("mode", canEdit ? "edit" : "view");
        editorConfig.put("lang", "en");
        editorConfig.put("user", user);
        editorConfig.put("customization", customization);

        Map<String, Object> result = new HashMap<>();
        result.put("documentType", docType);
        result.put("document", document);
        result.put("editorConfig", editorConfig);
        result.put("serverUrl", onlyOfficeUrl);

        // Sign ONLYOFFICE JWT token
        Map<String, Object> tokenPayload = new HashMap<>();
        tokenPayload.put("document", document);
        tokenPayload.put("editorConfig", editorConfig);
        tokenPayload.put("documentType", docType);

        String token = createOnlyOfficeToken(tokenPayload);
        result.put("token", token);
        document.put("token", token);
        editorConfig.put("token", token);

        return result;
    }

    @Transactional
    public void setOnlyOfficeSaveOptions(Long fileId, com.xuancong.student_management.dto.file.OnlyOfficeSaveOptionsRequest request) {
        if (request != null) {
            User currentUser = getAuthenticatedUser();
            log.info("Setting pending ONLYOFFICE save options for file {}: mode={}, desc={}, user={}",
                    fileId, request.getSaveMode(), request.getChangeDescription(), currentUser != null ? currentUser.getEmail() : "anonymous");
            pendingSaveOptions.put(fileId, new PendingSaveOption(request, currentUser));

            if (request.getChangeDescription() != null && !request.getChangeDescription().isBlank()) {
                String desc = request.getChangeDescription().trim();
                try {
                    List<ActivityLog> recentLogs = activityLogRepository.findTop5ByTargetFile_IdOrderByCreatedAtDesc(fileId);
                    Instant cutoff = Instant.now().minusSeconds(600);
                    for (ActivityLog al : recentLogs) {
                        if (al.getCreatedAt() != null && al.getCreatedAt().isAfter(cutoff) && al.getActionType() == ActivityType.UPDATE) {
                            Map<String, Object> m = al.getMetadata() != null ? new HashMap<>(al.getMetadata()) : new HashMap<>();
                            m.put("changeDescription", desc);
                            al.setMetadata(m);
                            if (currentUser != null) {
                                al.setActor(currentUser);
                            }
                            activityLogRepository.save(al);
                            log.info("Updated existing recent activity log {} with changeDescription: {}", al.getId(), desc);
                            break;
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not backfill changeDescription into recent activity log for file {}: {}", fileId, ex.getMessage());
                }
            }
        }
    }

    @Transactional
    public Map<String, Object> handleOnlyOfficeCallback(Long fileId, Map<String, Object> payload) {
        log.info("Received ONLYOFFICE callback for file {}: keys={}", fileId, payload != null ? payload.keySet() : null);

        if (payload != null && payload.containsKey("token") && payload.get("status") == null) {
            try {
                String token = (String) payload.get("token");
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(getOnlyOfficeSigningKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                payload = new HashMap<>(claims);
                log.info("Decoded ONLYOFFICE callback token payload: status={}", payload.get("status"));
            } catch (Exception e) {
                log.warn("Failed to parse ONLYOFFICE callback token: {}", e.getMessage());
            }
        }

        Integer status = payload != null && payload.get("status") instanceof Number ? ((Number) payload.get("status")).intValue() : null;
        if (status != null && (status == 2 || status == 6)) {
            PendingSaveOption pending = pendingSaveOptions.remove(fileId);
            com.xuancong.student_management.dto.file.OnlyOfficeSaveOptionsRequest options = pending != null ? pending.getRequest() : null;
            User editorUser = pending != null && pending.getUser() != null ? pending.getUser() : null;
            if (options != null && "DISCARD".equalsIgnoreCase(options.getSaveMode())) {
                log.info("ONLYOFFICE save discarded by user choice for file {}", fileId);
                return Map.of("error", 0);
            }

            String downloadUrl = (String) payload.get("url");
            if (downloadUrl != null && !downloadUrl.isBlank()) {
                FileItem file = getOrThrow(fileId);
                try {
                    String resolvedUrl = downloadUrl;
                    try {
                        java.net.URI rawUri = new java.net.URI(downloadUrl);
                        String pathAndQuery = rawUri.getRawPath() + (rawUri.getRawQuery() != null ? "?" + rawUri.getRawQuery() : "");
                        resolvedUrl = onlyOfficeUrl + pathAndQuery;
                    } catch (Exception uriEx) {
                        log.warn("Could not rewrite ONLYOFFICE downloadUrl {}: {}", downloadUrl, uriEx.getMessage());
                    }
                    log.info("Fetching edited document from ONLYOFFICE: original={}, resolved={}", downloadUrl, resolvedUrl);

                    java.net.URL url = new java.net.URI(resolvedUrl).toURL();
                    byte[] bytes;
                    try (java.io.InputStream in = url.openStream()) {
                        bytes = in.readAllBytes();
                    }

                    String ext = file.getFileType() != null ? file.getFileType().toLowerCase() : "docx";
                    String key = "docs/" + UUID.randomUUID() + "." + ext;
                    String newStoragePath = s3FileService.uploadBytes(key, bytes, "application/octet-stream");

                    file.setStoragePath(newStoragePath);
                    file.setSizeBytes((long) bytes.length);
                    file.setUpdatedAt(Instant.now());

                    boolean isOverwrite = options != null && "OVERWRITE".equalsIgnoreCase(options.getSaveMode());
                    if (isOverwrite) {
                        FileVersion currentVersion = file.getCurrentVersionId() != null
                                ? fileVersionRepository.findById(file.getCurrentVersionId()).orElse(null)
                                : fileVersionRepository.findTopByFile_IdOrderByVersionNoDesc(file.getId()).orElse(null);

                        if (currentVersion != null) {
                            currentVersion.setStoragePath(newStoragePath);
                            currentVersion.setSizeBytes((long) bytes.length);
                            fileVersionRepository.save(currentVersion);
                        } else {
                            FileVersion v = new FileVersion();
                            v.setFile(file);
                            v.setVersionNo(1);
                            v.setStoragePath(newStoragePath);
                            v.setSizeBytes((long) bytes.length);
                            v.setUploadedBy(file.getUploadedBy());
                            v.setCreatedAt(Instant.now());
                            v = fileVersionRepository.save(v);
                            file.setCurrentVersionId(v.getId());
                        }

                        fileItemRepository.save(file);

                        try {
                            aiService.deleteDocument(file.getId());
                            aiService.processAsync(file.getId(), newStoragePath);
                            log.info("Triggered AI re-indexing for overwritten document {}: newStoragePath={}", fileId, newStoragePath);
                        } catch (Exception aiEx) {
                            log.warn("Could not trigger AI re-indexing for file {}: {}", fileId, aiEx.getMessage());
                        }

                        Map<String, Object> meta = new HashMap<>();
                        meta.put("action", "ONLYOFFICE_OVERWRITE");
                        meta.put("fileName", file.getName());
                        if (options != null && options.getChangeDescription() != null && !options.getChangeDescription().isBlank()) {
                            meta.put("changeDescription", options.getChangeDescription().trim());
                        }
                        activityLogManagementService.logActivity(
                                file.getCompany(),
                                editorUser != null ? editorUser : file.getUploadedBy(),
                                com.xuancong.student_management.entity.enums.ActivityType.UPDATE,
                                file,
                                meta
                        );
                        log.info("ONLYOFFICE overwrite successfully processed for file {}", fileId);
                    } else {
                        int nextVersionNo = fileVersionRepository.findTopByFile_IdOrderByVersionNoDesc(file.getId())
                                .map(v -> v.getVersionNo() + 1)
                                .orElse(1);

                        FileVersion v = new FileVersion();
                        v.setFile(file);
                        v.setVersionNo(nextVersionNo);
                        v.setStoragePath(newStoragePath);
                        v.setSizeBytes((long) bytes.length);
                        v.setUploadedBy(file.getUploadedBy());
                        v.setCreatedAt(Instant.now());
                        v = fileVersionRepository.save(v);

                        file.setCurrentVersionId(v.getId());
                        fileItemRepository.save(file);

                        try {
                            aiService.deleteDocument(file.getId());
                            aiService.processAsync(file.getId(), newStoragePath);
                            log.info("Triggered AI re-indexing for new version document {}: newStoragePath={}", fileId, newStoragePath);
                        } catch (Exception aiEx) {
                            log.warn("Could not trigger AI re-indexing for file {}: {}", fileId, aiEx.getMessage());
                        }

                        Map<String, Object> meta = new HashMap<>();
                        meta.put("action", "ONLYOFFICE_NEW_VERSION");
                        meta.put("versionNo", nextVersionNo);
                        meta.put("fileName", file.getName());
                        if (options != null && options.getChangeDescription() != null && !options.getChangeDescription().isBlank()) {
                            meta.put("changeDescription", options.getChangeDescription().trim());
                        }
                        activityLogManagementService.logActivity(
                                file.getCompany(),
                                editorUser != null ? editorUser : file.getUploadedBy(),
                                com.xuancong.student_management.entity.enums.ActivityType.UPDATE,
                                file,
                                meta
                        );
                        log.info("ONLYOFFICE new version successfully processed for file {}: new version={}", fileId, nextVersionNo);
                    }
                } catch (Exception e) {
                    log.error("Failed to process ONLYOFFICE document save for file {}: {}", fileId, e.getMessage(), e);
                    return Map.of("error", 1);
                }
            }
        }

        return Map.of("error", 0);
    }
}
