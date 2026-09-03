package com.xuancong.student_management.dto.company;

public record CompanyUpdateRequest(
        String name,
        String email,
        String phone,
        String address
) {}
