package com.xuancong.student_management.controller;


import com.xuancong.student_management.dto.file.FileItemResponse;
import com.xuancong.student_management.dto.file.FilePermissionResponse;
import com.xuancong.student_management.dto.file.FilePermissionUpdateRequest;
import com.xuancong.student_management.dto.file.FileVersionResponse;
import com.xuancong.student_management.dto.file.TrashItemResponse;
import com.xuancong.student_management.service.FileManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileManagementController {

    private final FileManagementService fileManagementService;

    @GetMapping
    public ResponseEntity<List<FileItemResponse>> getActiveFiles() {
        return ResponseEntity.ok(fileManagementService.getActiveFiles());
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<FileItemResponse>> getSharedWithMeFiles() {
        return ResponseEntity.ok(fileManagementService.getSharedWithMeFiles());
    }

    @GetMapping("/starred")
    public ResponseEntity<List<Long>> getStarredFileIds() {
        return ResponseEntity.ok(fileManagementService.getStarredFileIds());
    }

    @PostMapping("/{id}/star")
    public ResponseEntity<Map<String, Object>> toggleStar(@PathVariable Long id) {
        boolean starred = fileManagementService.toggleStar(id);
        return ResponseEntity.ok(Map.of("fileId", id, "starred", starred));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileItemResponse> getFileDetail(@PathVariable Long id) {
        return ResponseEntity.ok(fileManagementService.getFileDetail(id));
    }

    @GetMapping({ "/{id}/stream", "/{id}/view" })
    public ResponseEntity<byte[]> streamFile(@PathVariable Long id) {
        return fileManagementService.streamFile(id);
    }

    @GetMapping("/{id}/preview-url")
    public ResponseEntity<Map<String, String>> getPreviewUrl(@PathVariable Long id) {
        return ResponseEntity.ok(fileManagementService.getPreviewUrl(id));
    }

    @GetMapping("/{id}/text")
    public ResponseEntity<Map<String, String>> getFileText(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("text", fileManagementService.getFileText(id)));
    }

    @PostMapping("/{id}/save-text-version")
    public ResponseEntity<FileItemResponse> saveTextVersion(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String content = body != null ? body.get("content") : "";
        return ResponseEntity.ok(fileManagementService.saveTextVersion(id, content));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<FileVersionResponse>> getFileVersions(@PathVariable Long id) {
        return ResponseEntity.ok(fileManagementService.getFileVersions(id));
    }

    @PostMapping(value = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileItemResponse> uploadNewVersion(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(fileManagementService.uploadNewVersion(id, file));
    }

    @GetMapping("/{id}/versions/{versionId}/stream")
    public ResponseEntity<byte[]> streamVersion(
            @PathVariable Long id,
            @PathVariable Long versionId
    ) {
        return fileManagementService.streamVersion(id, versionId);
    }

    @GetMapping("/{id}/permissions")
    public ResponseEntity<List<FilePermissionResponse>> getPermissions(@PathVariable Long id) {
        return ResponseEntity.ok(fileManagementService.getPermissions(id));
    }

    @PutMapping("/{id}/permissions")
    public ResponseEntity<List<FilePermissionResponse>> updatePermissions(
            @PathVariable Long id,
            @RequestBody FilePermissionUpdateRequest request
    ) {
        return ResponseEntity.ok(fileManagementService.updatePermissions(id, request));
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<FileItemResponse> updateVisibility(
            @PathVariable Long id,
            @RequestParam("visibility") String visibility
    ) {
        return ResponseEntity.ok(fileManagementService.updateVisibility(id, visibility));
    }

    @GetMapping("/tags")
    public ResponseEntity<List<String>> getAllTags() {
        return ResponseEntity.ok(fileManagementService.getAllTags());
    }

    @PutMapping("/{id}/tags")
    public ResponseEntity<FileItemResponse> updateFileTags(
            @PathVariable Long id,
            @RequestBody List<String> tags
    ) {
        return ResponseEntity.ok(fileManagementService.updateFileTags(id, tags));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileItemResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail
    ) {
        return ResponseEntity.ok(fileManagementService.uploadFile(file, folderId, tags, thumbnail));
    }

    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<byte[]> getThumbnail(@PathVariable Long id) {
        return fileManagementService.getThumbnail(id);
    }

    @PostMapping(value = "/{id}/thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadThumbnail(
            @PathVariable Long id,
            @RequestParam("thumbnail") MultipartFile thumbnail
    ) {
        fileManagementService.saveThumbnail(id, thumbnail);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/trash")
    public ResponseEntity<List<TrashItemResponse>> getTrash() {
        return ResponseEntity.ok(fileManagementService.getTrash());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable Long id) {
        fileManagementService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restore(@PathVariable Long id) {
        fileManagementService.restore(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanently(@PathVariable Long id) {
        fileManagementService.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/permanent/batch")
    public ResponseEntity<Void> deletePermanentlyBatch(@RequestBody List<Long> ids) {
        fileManagementService.deletePermanentlyBatch(ids);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/restore/batch")
    public ResponseEntity<Void> restoreBatch(@RequestBody List<Long> ids) {
        fileManagementService.restoreBatch(ids);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<FileItemResponse> moveFile(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        Long targetFolderId = null;
        if (body != null && body.get("folderId") != null) {
            String fIdStr = body.get("folderId").toString();
            if (!fIdStr.isBlank() && !fIdStr.equalsIgnoreCase("null") && !fIdStr.equalsIgnoreCase("all")) {
                try {
                    targetFolderId = Long.parseLong(fIdStr);
                } catch (NumberFormatException ignored) {}
            }
        }
        return ResponseEntity.ok(fileManagementService.moveFile(id, targetFolderId));
    }

    @PutMapping("/move-batch")
    public ResponseEntity<List<FileItemResponse>> moveFilesBatch(
            @RequestBody Map<String, Object> body
    ) {
        Long targetFolderId = null;
        if (body != null && body.get("folderId") != null) {
            String fIdStr = body.get("folderId").toString();
            if (!fIdStr.isBlank() && !fIdStr.equalsIgnoreCase("null") && !fIdStr.equalsIgnoreCase("all")) {
                try {
                    targetFolderId = Long.parseLong(fIdStr);
                } catch (NumberFormatException ignored) {}
            }
        }
        List<Long> fileIds = new ArrayList<>();
        if (body != null && body.get("fileIds") instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) {
                    try {
                        fileIds.add(Long.parseLong(item.toString()));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return ResponseEntity.ok(fileManagementService.moveFilesBatch(fileIds, targetFolderId));
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<FileItemResponse> renameFile(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String name = body != null ? body.get("name") : null;
        return ResponseEntity.ok(fileManagementService.renameFile(id, name));
    }
}
