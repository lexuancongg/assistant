package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.forders.FolderCreateRequest;
import com.xuancong.student_management.dto.forders.FolderPermissionResponse;
import com.xuancong.student_management.dto.forders.FolderPermissionUpdateRequest;
import com.xuancong.student_management.dto.forders.FolderRenameRequest;
import com.xuancong.student_management.dto.forders.FolderResponse;
import com.xuancong.student_management.entity.Folder;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.repository.UserRepository;
import com.xuancong.student_management.security.CustomUserDetails;
import com.xuancong.student_management.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/folders", "/api/v1/forders"})
@RequiredArgsConstructor
public class ForderController {

    private final FolderService folderService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<FolderResponse>> getFolderTree() {
        return ResponseEntity.ok(folderService.getTree());
    }

    @GetMapping("/{folderId}")
    public ResponseEntity<FolderResponse> getFolderById(@PathVariable Long folderId) {
        Folder folder = folderService.getById(folderId);
        return ResponseEntity.ok(FolderResponse.from(folder));
    }

    @PostMapping
    public ResponseEntity<FolderResponse> create(@RequestBody FolderCreateRequest request) {
        User currentUser = getCurrentUser();
        Folder folder = folderService.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(FolderResponse.from(folder));
    }

    @PutMapping("/{folderId}/rename")
    public ResponseEntity<FolderResponse> rename(
            @PathVariable Long folderId,
            @RequestBody FolderRenameRequest request
    ) {
        User currentUser = getCurrentUser();
        Folder folder = folderService.rename(folderId, request.name(), currentUser);
        return ResponseEntity.ok(FolderResponse.from(folder));
    }

    @DeleteMapping("/{folderId}")
    public ResponseEntity<Void> delete(@PathVariable Long folderId) {
        User currentUser = getCurrentUser();
        folderService.delete(folderId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{folderId}/permissions")
    public ResponseEntity<List<FolderPermissionResponse>> getPermissions(@PathVariable Long folderId) {
        return ResponseEntity.ok(folderService.getPermissions(folderId));
    }

    @PutMapping("/{folderId}/permissions")
    public ResponseEntity<List<FolderPermissionResponse>> updatePermissions(
            @PathVariable Long folderId,
            @RequestBody FolderPermissionUpdateRequest request
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(folderService.updatePermissions(folderId, request, currentUser));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cd) {
            return cd.getUser();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized access");
    }
}
