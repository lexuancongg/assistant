package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.forders.FolderCreateRequest;
import com.xuancong.student_management.dto.forders.FolderPermissionResponse;
import com.xuancong.student_management.dto.forders.FolderPermissionUpdateRequest;
import com.xuancong.student_management.dto.forders.FolderResponse;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.Department;
import com.xuancong.student_management.entity.Folder;
import com.xuancong.student_management.entity.FolderPermission;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import com.xuancong.student_management.entity.enums.UserRole;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.DepartmentRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.FolderPermissionRepository;
import com.xuancong.student_management.repository.FolderRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final FileItemRepository fileItemRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    /** Tạo folder mới */
    public Folder create(FolderCreateRequest request, User createdBy) {
        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên thư mục không được để trống");
        }
        String folderName = request.name().trim();

        Company company = createdBy != null && createdBy.getCompany() != null 
                ? createdBy.getCompany() 
                : companyRepository.findAll().stream().findFirst().orElse(null);

        Folder parent = null;
        if (request.parentId() != null && !request.parentId().isBlank() && !request.parentId().equalsIgnoreCase("all") && !request.parentId().equalsIgnoreCase("root")) {
            try {
                Long parentId = Long.parseLong(request.parentId());
                parent = folderRepository.findById(parentId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục cha không tồn tại"));
            } catch (NumberFormatException e) {
                // parentId không hợp lệ — tạo root folder
            }
        }

        // Kiểm tra xem đã tồn tại thư mục cùng tên trong cùng thư mục cha chưa
        boolean exists = parent != null
                ? folderRepository.existsByCompanyAndParentAndNameIgnoreCase(company, parent, folderName)
                : folderRepository.existsByCompanyAndParentIsNullAndNameIgnoreCase(company, folderName);

        if (exists) {
            String parentDesc = parent != null ? "\"" + parent.getName() + "\"" : "Drive của tôi";
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thư mục \"" + folderName + "\" đã tồn tại trong " + parentDesc);
        }

        Folder folder = new Folder();
        folder.setName(folderName);
        folder.setCompany(company);
        folder.setCreatedBy(createdBy);
        folder.setParent(parent);

        return folderRepository.save(folder);
    }

    /** Đổi tên folder */
    @Transactional
    public Folder rename(Long folderId, String newName, User currentUser) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên thư mục không được để trống");
        }
        String trimmedName = newName.trim();
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại"));

        // Kiểm tra quyền: Admin, hoặc Manager, hoặc người tạo thư mục, hoặc có quyền truy cập
        if (currentUser != null && currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.MANAGER) {
            if (folder.getCreatedBy() != null && !folder.getCreatedBy().getId().equals(currentUser.getId())) {
                boolean hasPerm = hasDirectPermission(currentUser, folderId);
                if (!hasPerm) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền đổi tên thư mục này");
                }
            }
        }

        // Kiểm tra xem có thư mục khác cùng tên trong cùng thư mục cha chưa
        boolean exists = folder.getParent() != null
                ? folderRepository.existsByCompanyAndParentAndNameIgnoreCaseAndIdNot(folder.getCompany(), folder.getParent(), trimmedName, folderId)
                : folderRepository.existsByCompanyAndParentIsNullAndNameIgnoreCaseAndIdNot(folder.getCompany(), trimmedName, folderId);

        if (exists) {
            String parentDesc = folder.getParent() != null ? "\"" + folder.getParent().getName() + "\"" : "Drive của tôi";
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thư mục \"" + trimmedName + "\" đã tồn tại trong " + parentDesc);
        }

        folder.setName(trimmedName);
        return folderRepository.save(folder);
    }

    /** Xóa folder và chuyển tất cả các file bên trong vào thùng rác */
    @Transactional
    public void delete(Long folderId, User currentUser) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thư mục không tồn tại"));

        // Kiểm tra quyền: Admin, Manager, hoặc người tạo thư mục, hoặc có quyền EDITOR
        if (currentUser != null && currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.MANAGER) {
            if (folder.getCreatedBy() != null && !folder.getCreatedBy().getId().equals(currentUser.getId())) {
                boolean canEdit = canUploadToFolder(currentUser, folder);
                if (!canEdit) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa thư mục này");
                }
            }
        }

        deleteFolderRecursive(folder);
    }

    private void deleteFolderRecursive(Folder folder) {
        if (folder.getChildren() != null) {
            List<Folder> childrenCopy = new ArrayList<>(folder.getChildren());
            for (Folder child : childrenCopy) {
                deleteFolderRecursive(child);
            }
            folder.getChildren().clear();
        }

        // Chuyển toàn bộ file trong thư mục này vào thùng rác và gỡ liên kết với folder
        List<FileItem> files = fileItemRepository.findByFolderId(folder.getId());
        for (FileItem file : files) {
            file.setFolder(null);
            if (file.getDeletedAt() == null) {
                file.setDeletedAt(Instant.now());
            }
            fileItemRepository.save(file);
        }
        fileItemRepository.flush();

        // Xóa phân quyền trực tiếp của folder
        folderPermissionRepository.deleteByFolderIdDirect(folder.getId());
        folderPermissionRepository.flush();

        // Xóa chính folder
        folderRepository.delete(folder);
        folderRepository.flush();
    }

    /** Lấy cây folder */
    public List<FolderResponse> getTree() {
        List<Folder> allFolders = folderRepository.findAll();

        // Lấy root folders (không có parent)
        List<Folder> roots = allFolders.stream()
                .filter(f -> f.getParent() == null)
                .toList();

        return roots.stream()
                .map(f -> buildTree(f, allFolders))
                .toList();
    }

    public Folder getById(Long folderId) {
        return folderRepository.findById(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
    }

    private FolderResponse buildTree(Folder folder, List<Folder> all) {
        List<FolderResponse> children = all.stream()
                .filter(f -> f.getParent() != null && f.getParent().getId().equals(folder.getId()))
                .map(f -> buildTree(f, all))
                .toList();

        User u = folder.getCreatedBy();
        return new FolderResponse(
                folder.getId(),
                folder.getName(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                folder.getCompany() != null ? folder.getCompany().getId() : null,
                u != null ? u.getId() : null,
                u != null ? u.getName() : null,
                u != null ? u.getEmail() : null,
                folder.getCreatedAt(),
                children
        );
    }

    /** Lấy danh sách phân quyền của folder */
    @Transactional(readOnly = true)
    public List<FolderPermissionResponse> getPermissions(Long folderId) {
        List<FolderPermission> list = folderPermissionRepository.findByFolderId(folderId);
        return list.stream().map(this::toResponse).toList();
    }

    /** Cập nhật phân quyền cho folder */
    @Transactional
    public List<FolderPermissionResponse> updatePermissions(Long folderId, FolderPermissionUpdateRequest request, User currentUser) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));

        // Cập nhật người phụ trách / chủ sở hữu thư mục nếu có truyền lên
        if (request != null && request.ownerId() != null) {
            User newOwner = userRepository.findById(request.ownerId()).orElse(null);
            if (newOwner != null) {
                folder.setCreatedBy(newOwner);
                folderRepository.save(folder);
            }
        }

        // 1. Xóa các quyền cũ trực tiếp và flush ngay vào DB
        folderPermissionRepository.deleteByFolderIdDirect(folderId);
        folderPermissionRepository.flush();

        // 2. Thêm danh sách quyền mới (lọc trùng lặp)
        if (request != null && request.permissions() != null) {
            Set<String> seen = new HashSet<>();
            List<FolderPermission> toSave = new ArrayList<>();

            for (FolderPermissionUpdateRequest.FolderPermissionItemRequest item : request.permissions()) {
                if (item.subjectId() == null) continue;
                PermissionSubjectType sType = item.subjectType() != null ? item.subjectType() : PermissionSubjectType.DEPARTMENT;
                String key = sType + ":" + item.subjectId();
                if (seen.contains(key)) continue;
                seen.add(key);

                FolderPermission perm = new FolderPermission();
                perm.setFolder(folder);
                perm.setSubjectType(sType);
                perm.setSubjectId(item.subjectId());
                perm.setLevel(item.level() != null ? item.level() : PermissionLevel.VIEWER);
                toSave.add(perm);
            }

            if (!toSave.isEmpty()) {
                folderPermissionRepository.saveAll(toSave);
                folderPermissionRepository.flush();
            }
        }

        return getPermissions(folderId);
    }

    private FolderPermissionResponse toResponse(FolderPermission p) {
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

        return new FolderPermissionResponse(
                p.getId(),
                p.getFolder().getId(),
                p.getSubjectType(),
                p.getSubjectId(),
                name,
                detail,
                p.getLevel(),
                p.getCreatedAt()
        );
    }

    /**
     * THUẬT TOÁN DUYỆT CÂY ĐỆ QUY NGƯỢC (Bottom-Up Hierarchical Traversal):
     * Kiểm tra xem người dùng có quyền truy cập vào Thư mục này không.
     * Tự động leo ngược theo con trỏ parent_id từ thư mục con lên tất cả các cấp cha, ông, cụ...
     * Nếu tìm thấy quyền ở BẤT KỲ CẤP NÀO -> Kế thừa hợp lệ (Return true).
     */
    @Transactional(readOnly = true)
    public boolean hasAccessRecursive(User user, Folder folder) {
        if (user == null || folder == null) return false;

        // Quản trị viên (ADMIN) mặc định luôn có toàn quyền trên toàn hệ thống
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }

        Folder current = folder;
        // Duyệt ngược từ dưới lên trên (Bottom-Up Traversal)
        while (current != null) {
            List<FolderPermission> permissions = folderPermissionRepository.findByFolderId(current.getId());
            // Nếu bị loại trừ (DENY) cụ thể tại cấp thư mục này -> Từ chối truy cập ngay lập tức
            boolean isExplicitlyDenied = permissions.stream().anyMatch(p ->
                    p.getSubjectType() == PermissionSubjectType.USER
                    && user.getId().equals(p.getSubjectId())
                    && p.getLevel() == PermissionLevel.DENY
            );
            if (isExplicitlyDenied) {
                return false;
            }

            if (hasDirectPermission(user, current.getId())) {
                return true; // Tìm thấy quyền kế thừa hợp lệ tại cấp hiện tại!
            }
            current = current.getParent(); // Leo ngược lên thư mục cha
        }

        return false;
    }

    /**
     * Kiểm tra xem người dùng có quyền Tải lên / Chuyển file vào Thư mục này không.
     * ADMIN, người tạo thư mục, phòng ban mặc định hoặc có quyền EDITOR (trực tiếp/kế thừa).
     */
    @Transactional(readOnly = true)
    public boolean canUploadToFolder(User user, Folder folder) {
        if (user == null || folder == null) return false;
        if (user.getRole() == UserRole.ADMIN) return true;

        // Người tạo thư mục luôn có quyền upload/chỉnh sửa
        if (folder.getCreatedBy() != null && folder.getCreatedBy().getId().equals(user.getId())) {
            return true;
        }

        // Phòng ban mặc định phụ trách thư mục
        if (folder.getDefaultDepartment() != null && user.getDepartment() != null
                && folder.getDefaultDepartment().getId().equals(user.getDepartment().getId())) {
            return true;
        }

        Folder current = folder;
        while (current != null) {
            List<FolderPermission> permissions = folderPermissionRepository.findByFolderId(current.getId());
            // Nếu bị DENY -> từ chối ngay
            boolean isExplicitlyDenied = permissions.stream().anyMatch(p ->
                    p.getSubjectType() == PermissionSubjectType.USER
                    && user.getId().equals(p.getSubjectId())
                    && p.getLevel() == PermissionLevel.DENY
            );
            if (isExplicitlyDenied) {
                return false;
            }

            // Kiểm tra quyền EDITOR trên User
            boolean hasUserEditor = permissions.stream().anyMatch(p ->
                    p.getSubjectType() == PermissionSubjectType.USER
                    && user.getId().equals(p.getSubjectId())
                    && p.getLevel() == PermissionLevel.EDITOR
            );
            if (hasUserEditor) return true;

            // Kiểm tra quyền EDITOR trên Phòng ban của User
            if (user.getDepartment() != null) {
                boolean hasDeptEditor = permissions.stream().anyMatch(p ->
                        p.getSubjectType() == PermissionSubjectType.DEPARTMENT
                        && user.getDepartment().getId().equals(p.getSubjectId())
                        && p.getLevel() == PermissionLevel.EDITOR
                );
                if (hasDeptEditor) return true;
            }

            current = current.getParent();
        }

        return false;
    }

    /**
     * Kiểm tra quyền trực tiếp tại 1 thư mục cụ thể (xét theo User cá nhân hoặc Phòng ban trực thuộc)
     */
    @Transactional(readOnly = true)
    public boolean hasDirectPermission(User user, Long folderId) {
        if (user == null || folderId == null) return false;

        List<FolderPermission> permissions = folderPermissionRepository.findByFolderId(folderId);
        if (permissions.isEmpty()) {
            return false;
        }

        // Nếu User bị loại trừ (DENY) tại thư mục này -> Từ chối ngay
        boolean isExplicitlyDenied = permissions.stream().anyMatch(p ->
                p.getSubjectType() == PermissionSubjectType.USER
                && user.getId().equals(p.getSubjectId())
                && p.getLevel() == PermissionLevel.DENY
        );
        if (isExplicitlyDenied) {
            return false;
        }

        for (FolderPermission p : permissions) {
            if (p.getLevel() == PermissionLevel.DENY) continue;
            // 1. Quyền được cấp trực tiếp cho User
            if (p.getSubjectType() == PermissionSubjectType.USER && user.getId().equals(p.getSubjectId())) {
                return true;
            }
            // 2. Quyền được cấp cho Phòng ban mà User đang trực thuộc
            if (p.getSubjectType() == PermissionSubjectType.DEPARTMENT
                    && user.getDepartment() != null
                    && user.getDepartment().getId().equals(p.getSubjectId())) {
                return true;
            }
        }

        return false;
    }

    /**
     * Lấy toàn bộ quyền kế thừa từ tất cả các cấp thư mục cha (từ folder hiện tại leo lên root)
     */
    @Transactional(readOnly = true)
    public List<FolderPermission> getAllInheritedPermissions(Long folderId) {
        List<FolderPermission> all = new ArrayList<>();
        Folder current = folderRepository.findById(folderId).orElse(null);
        while (current != null) {
            all.addAll(folderPermissionRepository.findByFolderId(current.getId()));
            current = current.getParent();
        }
        return all;
    }

    /**
     * Lấy chuỗi đường dẫn thư mục đa cấp từ Gốc đến Thư mục hiện tại (phục vụ hiển thị Breadcrumb)
     * Ví dụ: ["Tài liệu công ty", "Phòng Kế toán", "Năm 2026", "Hợp đồng Q1"]
     */
    @Transactional(readOnly = true)
    public List<String> getFolderPathNames(Long folderId) {
        List<String> path = new ArrayList<>();
        Folder current = folderRepository.findById(folderId).orElse(null);
        while (current != null) {
            path.add(0, current.getName());
            current = current.getParent();
        }
        return path;
    }
}