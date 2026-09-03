package com.xuancong.student_management.dto.auth;

/** Đăng ký tài khoản mới bằng email + tên + mật khẩu */
public record RegisterRequest(String name, String email, String password) {}
