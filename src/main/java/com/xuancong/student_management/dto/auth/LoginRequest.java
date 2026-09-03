package com.xuancong.student_management.dto.auth;

/** Login dùng email hoặc username */
public record LoginRequest(String email, String username, String password) {
    public String getLoginIdentifier() {
        if (email != null && !email.isBlank()) {
            return email.trim().toLowerCase();
        }
        if (username != null && !username.isBlank()) {
            return username.trim().toLowerCase();
        }
        return null;
    }
}
