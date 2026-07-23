package com.xuancong.student_management.dto.auth;

public record AuthResponse(
        Long id,
        String username,
        String email,
        String accessToken,
        String refreshToken,
        String role
) {
}
