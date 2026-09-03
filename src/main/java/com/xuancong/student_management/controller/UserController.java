package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.user.UserCreateRequest;
import com.xuancong.student_management.dto.user.UserResponse;
import com.xuancong.student_management.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll() {
        return ResponseEntity.ok(userManagementService.getAll());
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagementService.create(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.getOrDefault("status", "ACTIVE");
        return ResponseEntity.ok(userManagementService.updateStatus(id, status));
    }
}
