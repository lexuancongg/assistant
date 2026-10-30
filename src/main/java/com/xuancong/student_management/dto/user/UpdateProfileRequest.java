package com.xuancong.student_management.dto.user;

public record UpdateProfileRequest(
        String name,
        String avatarUrl
) {}
