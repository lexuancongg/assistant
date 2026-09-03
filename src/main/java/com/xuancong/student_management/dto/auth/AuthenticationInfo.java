package com.xuancong.student_management.dto.auth;

public record AuthenticationInfo(UserAuthenticationInfo user, boolean authenticated) {}