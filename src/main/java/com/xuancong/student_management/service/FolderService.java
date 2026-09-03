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
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.DepartmentRepository;
import com.xuancong.student_management.repository.FolderPermissionRepository;
import com.xuancong.student_management.repository.FolderRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    /** Tạo folder mới */
    public Folder create(FolderCreateRequest request, User createdBy) {
        Company company = createdBy != null && createdBy.getCompany() != null 
                ? createdBy.getCompany() 
                : companyRepository.findAll().stream().findFirst().orElse(null);

        Folder folder = new Folder();
        folder.setName(request.name().trim());
        folder.setCompany(company);
        folder.setCreatedBy(createdBy);

        if (request.parentId() != null && !request.parentId().isBlank()) {
            try {
                Long parentId = Long.parseLong(request.parentId());
                Folder parent = folderRepository.findById(parentId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent folder not found"));
                folder.setParent(parent);
            } catch (NumberFormatException e) {
                // parentId không hợp lệ — tạo root folder
            }
        }

        return folderRepository.save(folder);
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

    private FolderResponse buildTree(Folder folder, List<Folder> all) {
        List<FolderResponse> children = all.stream()
                .filter(f -> f.getParent() != null && f.getParent().getId().equals(folder.getId()))
                .map(f -> buildTree(f, all))
                .toList();

        return new FolderResponse(
                folder.getId(),
                folder.getName(),
                folder.getParent() != null ? folder.getParent().getId() : null,
                folder.getCompany() != null ? folder.getCompany().getId() : null,
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
}