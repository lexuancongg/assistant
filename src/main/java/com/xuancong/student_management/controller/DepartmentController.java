package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.department.DepartmentAddMemberRequest;
import com.xuancong.student_management.dto.department.DepartmentCreateRequest;
import com.xuancong.student_management.dto.department.DepartmentResponse;
import com.xuancong.student_management.service.DepartmentManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentManagementService departmentManagementService;

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAll() {
        return ResponseEntity.ok(departmentManagementService.getAll());
    }

    @PostMapping
    public ResponseEntity<DepartmentResponse> create(@RequestBody DepartmentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(departmentManagementService.create(request));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<DepartmentResponse> addMember(
            @PathVariable UUID id,
            @RequestBody DepartmentAddMemberRequest request
    ) {
        return ResponseEntity.ok(departmentManagementService.addMember(id, request));
    }

    @DeleteMapping("/{deptId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID deptId,
            @PathVariable UUID userId
    ) {
        departmentManagementService.removeMember(deptId, userId);
        return ResponseEntity.noContent().build();
    }
}
