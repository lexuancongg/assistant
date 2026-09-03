package com.xuancong.student_management.dto.dashboard;

public record DashboardStatsResponse(
        long totalFiles,
        String totalStorage,    // e.g. "24.6 GB"
        long aiIndexedFiles,
        long totalUsers
) {}
