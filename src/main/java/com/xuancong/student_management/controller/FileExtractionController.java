package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.file.FileExtractionResponse;
import com.xuancong.student_management.dto.file.FileExtractionUpdateRequest;
import com.xuancong.student_management.service.FileExtractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/files/{fileId}/extraction")
@RequiredArgsConstructor
public class FileExtractionController {

    private final FileExtractionService fileExtractionService;

    @GetMapping
    public ResponseEntity<FileExtractionResponse> getExtraction(@PathVariable Long fileId) {
        FileExtractionResponse response = fileExtractionService.getExtraction(fileId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<FileExtractionResponse> extract(
            @PathVariable Long fileId,
            @RequestParam(defaultValue = "false") boolean force
    ) {
        return ResponseEntity.ok(fileExtractionService.extract(fileId, force));
    }

    @PutMapping
    public ResponseEntity<FileExtractionResponse> update(
            @PathVariable Long fileId,
            @RequestBody FileExtractionUpdateRequest request
    ) {
        return ResponseEntity.ok(fileExtractionService.update(fileId, request));
    }
}
