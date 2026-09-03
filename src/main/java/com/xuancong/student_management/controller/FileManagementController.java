package com.xuancong.student_management.controller;


import com.xuancong.student_management.dto.file.FileItemResponse;
import com.xuancong.student_management.dto.file.TrashItemResponse;
import com.xuancong.student_management.service.FileManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
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

    @GetMapping("/{id}")
    public ResponseEntity<FileItemResponse> getFileDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(fileManagementService.getFileDetail(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileItemResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId
    ) {
        return ResponseEntity.ok(fileManagementService.uploadFile(file, folderId));
    }

    @GetMapping("/trash")
    public ResponseEntity<List<TrashItemResponse>> getTrash() {
        return ResponseEntity.ok(fileManagementService.getTrash());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDelete(@PathVariable UUID id) {
        fileManagementService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restore(@PathVariable UUID id) {
        fileManagementService.restore(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanently(@PathVariable UUID id) {
        fileManagementService.deletePermanently(id);
        return ResponseEntity.noContent().build();
    }
}
