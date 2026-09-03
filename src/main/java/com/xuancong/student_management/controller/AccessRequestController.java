package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.access.AccessRequestCreateRequest;
import com.xuancong.student_management.dto.access.AccessRequestResponse;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.service.AccessRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/access-requests")
@RequiredArgsConstructor
public class AccessRequestController {

    private final AccessRequestService accessRequestService;

    @PostMapping
    public ResponseEntity<AccessRequestResponse> createRequest(
            @RequestBody AccessRequestCreateRequest req,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(accessRequestService.createRequest(req, currentUser));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<AccessRequestResponse>> getPendingRequests() {
        return ResponseEntity.ok(accessRequestService.getPendingRequests());
    }

    @GetMapping("/my")
    public ResponseEntity<List<AccessRequestResponse>> getMyRequests(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(accessRequestService.getMyRequests(currentUser));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getPendingCount() {
        return ResponseEntity.ok(Map.of("pendingCount", accessRequestService.getPendingCount()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<AccessRequestResponse> approveRequest(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(accessRequestService.approveRequest(id, currentUser));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<AccessRequestResponse> rejectRequest(
            @PathVariable UUID id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(accessRequestService.rejectRequest(id, currentUser));
    }
}