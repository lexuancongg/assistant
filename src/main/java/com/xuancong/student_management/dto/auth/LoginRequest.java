package com.xuancong.student_management.dto.auth;

public record LoginRequest(
        String username,
        String password
) {
}
