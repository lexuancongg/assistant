package com.xuancong.student_management.dto.auth;

import java.util.UUID;

public record AuthResponse(
        UUID id,
        String name,
        String email,
        String accessToken,
        String refreshToken,
        String role
) {}
