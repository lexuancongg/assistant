package com.xuancong.student_management.dto.department;

import java.util.List;
import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        String name,
        List<DepartmentMemberResponse> members
) {}
