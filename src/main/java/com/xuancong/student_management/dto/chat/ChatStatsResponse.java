package com.xuancong.student_management.dto.chat;

public record ChatStatsResponse(
        long totalSessions,
        long totalMessages,
        long totalUsers,
        long favoriteSessions
) {
}
