package com.xuancong.student_management.dto.dashboard;

import java.util.List;
import java.util.UUID;

public record DashboardStatsResponse(
        long totalFiles,
        long aiIndexedFiles,
        String totalStorage,
        double usedStorageGb,
        double storageQuotaGb,
        long totalFolders,
        long totalDepartments,
        long totalUsers,
        long aiQueriesToday,
        long queriesYesterday,
        Double queriesGrowthPercent,
        long totalAiQueries,
        Double ragAccuracy,
        Integer averageLatencyMs,
        String qdrantStatus,
        Double userSatisfactionRate,
        long totalChunksIndexed,
        long monthlyTokensUsed,
        List<FormatStatDto> formatStats,
        List<TopDocDto> topDocuments,
        List<ActivityFeedDto> recentActivities,
        List<DailyQueryStatDto> dailyStats
) {
    public record FormatStatDto(
            String format,
            String label,
            long count,
            double percentage,
            String color
    ) {}

    public record TopDocDto(
            Long id,
            String name,
            String format,
            String version,
            String size,
            int chunks,
            String department,
            RbacInfo rbac,
            long ragQueries,
            String helpfulness
    ) {}

    public record RbacInfo(
            String label,
            String type // confidential | internal | restricted | public
    ) {}

    public record ActivityFeedDto(
            Long id,
            String iconType, // file | ai | access | alert
            String actorName,
            String action,
            String targetName,
            String meta,
            boolean isWarning
    ) {}

    public record DailyQueryStatDto(
            String date,
            long queries,
            int latency
    ) {}
}

