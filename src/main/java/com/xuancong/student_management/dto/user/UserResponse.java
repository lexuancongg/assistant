package com.xuancong.student_management.dto.user;

import java.util.UUID;

public record UserResponse(
        Long id,
        String name,
        String email,
        String role,
        String status,
        String avatarInitial,
        String avatarUrl,
        String departmentName
) {
    public UserResponse(Long id, String name, String email, String role, String status, String avatarInitial) {
        this(id, name, email, role, status, avatarInitial, null, null);
    }
}
