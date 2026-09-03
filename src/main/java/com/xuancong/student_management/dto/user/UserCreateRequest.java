package com.xuancong.student_management.dto.user;

public record UserCreateRequest(String name, String email, String password, String role) {}
