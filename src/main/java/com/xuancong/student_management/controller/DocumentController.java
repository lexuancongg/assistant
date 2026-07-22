package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.docs.DashboardStatsResponse;
import com.xuancong.student_management.dto.docs.DocumentDetailResponse;
import com.xuancong.student_management.dto.docs.DocumentPreviewResponse;
import com.xuancong.student_management.dto.docs.DocumentResponse;
import com.xuancong.student_management.dto.paging.PageResponse;
import com.xuancong.student_management.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentPreviewResponse> uploadDocument(
            @RequestParam("file") MultipartFile file) {
        DocumentPreviewResponse response = documentService.upload(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        return ResponseEntity.ok(
                this.documentService.getStats()
        );
    }

//    @GetMapping()
//    public ResponseEntity<PageResponse<DocumentResponse>> getDocsPaging(){
//        return ResponseEntity.ok(
//                this.documentService.getDocsPaging()
//        );
//    }

    @GetMapping()
    public ResponseEntity<List<DocumentResponse>> getDocuments() {
        return ResponseEntity.ok(
                this.documentService.getDocs()
        );
    }


    @GetMapping("/{id}")

    public ResponseEntity<DocumentDetailResponse>  getDocDetail(@PathVariable Long id) {
        return ResponseEntity.ok(
                this.documentService.getDocDetail(id)
        );
    }


}
