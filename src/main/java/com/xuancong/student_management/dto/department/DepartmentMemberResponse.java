package com.xuancong.student_management.dto.department;

import java.util.UUID;

public record DepartmentMemberResponse(
        Long userId,
        String name,
        String email,
        String role   // "Trưởng phòng" | "Thành viên"
) {}
