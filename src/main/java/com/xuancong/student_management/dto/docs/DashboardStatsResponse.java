package com.xuancong.student_management.dto.docs;

public record DashboardStatsResponse(
        Stat total,
        Stat contract,
        Stat invoice,
        Stat email,
        Stat other
) {

    public record Stat(
            long count,
            double growthPercent
    ) {
    }
}