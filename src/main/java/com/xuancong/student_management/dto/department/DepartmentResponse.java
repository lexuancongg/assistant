package com.xuancong.student_management.dto.department;

import java.util.List;
import java.util.UUID;

public record DepartmentResponse(
        Long id,
        String name,
        List<DepartmentMemberResponse> members
) {}
