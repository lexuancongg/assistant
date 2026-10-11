package com.xuancong.student_management.dto.user;

import java.util.UUID;

public record UserResponse(
        Long id,
        String name,
        String email,
        String role,
        String status,
        String avatarInitial
) {}
