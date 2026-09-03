package com.xuancong.student_management.dto.company;

public record CompanyInfoResponse(
        Long id,
        String name,
        String email,
        String phone,
        String address,
        Integer storageQuotaGb
) {}
