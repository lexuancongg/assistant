package com.xuancong.student_management.dto.auth;

public record RegisterRequest(
        String username,
        String password,
        String email
) {
}
