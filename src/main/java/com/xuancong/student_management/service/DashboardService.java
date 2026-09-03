package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.dashboard.DashboardStatsResponse;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final Long DEFAULT_COMPANY_ID = 1L;

    private final FileItemRepository fileItemRepository;
    private final UserRepository userRepository;

    public DashboardStatsResponse getStats() {
        long totalFiles    = fileItemRepository.countByCompanyIdAndDeletedAtIsNull(DEFAULT_COMPANY_ID);
        long totalBytes    = fileItemRepository.sumSizeByCompanyId(DEFAULT_COMPANY_ID);
        long aiIndexed     = fileItemRepository.countByCompanyIdAndDeletedAtIsNullAndAiIndexed(DEFAULT_COMPANY_ID, true);
        long totalUsers    = userRepository.count();

        return new DashboardStatsResponse(
                totalFiles,
                formatBytes(totalBytes),
                aiIndexed,
                totalUsers
        );
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024L * 1024) return String.format("%.0f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
