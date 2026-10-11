package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.file.DocumentChunkDto;
import com.xuancong.student_management.service.DocumentChunkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class DocumentChunkController {

    private final DocumentChunkService documentChunkService;

    @GetMapping("/{fileId}/chunks")
    public ResponseEntity<List<DocumentChunkDto>> getFileChunks(@PathVariable Long fileId) {
        return ResponseEntity.ok(documentChunkService.getChunksByFileId(fileId));
    }
}
