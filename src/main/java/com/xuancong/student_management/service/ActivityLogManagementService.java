package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.activity.ActivityLogResponse;
import com.xuancong.student_management.entity.ActivityLog;
import com.xuancong.student_management.entity.Company;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.ActivityType;
import com.xuancong.student_management.repository.ActivityLogRepository;
import com.xuancong.student_management.repository.CompanyRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogManagementService {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final ActivityLogRepository activityLogRepository;
    private final FileItemRepository fileItemRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @PostConstruct
    @Transactional
    public void backfillLogsIfEmpty() {
        try {
            if (activityLogRepository.count() == 0) {
                List<FileItem> allFiles = fileItemRepository.findAll();
                Company fallbackCompany = companyRepository.findAll().stream().findFirst().orElse(null);
                for (FileItem file : allFiles) {
                    Company comp = file.getCompany() != null ? file.getCompany() : fallbackCompany;
                    if (comp == null) continue;

                    ActivityLog activityLog = new ActivityLog();
                    activityLog.setCompany(comp);
                    activityLog.setActor(file.getUploadedBy());
                    activityLog.setActionType(ActivityType.UPLOAD);
                    activityLog.setTargetFile(file);
                    activityLog.setCreatedAt(file.getCreatedAt() != null ? file.getCreatedAt() : Instant.now());
                    activityLog.setMetadata(Map.of("fileName", file.getName() != null ? file.getName() : ""));
                    activityLogRepository.save(activityLog);
                }
            }
        } catch (Exception e) {
            log.warn("Backfill activity logs skipped: {}", e.getMessage());
        }
    }

    public List<ActivityLogResponse> getAll() {
        User currentUser = getAuthenticatedUser();
        List<ActivityLog> logs;
        if (currentUser != null && currentUser.getCompany() != null) {
            logs = activityLogRepository.findByCompanyIdOrderByCreatedAtDesc(currentUser.getCompany().getId());
            if (logs.isEmpty()) {
                logs = activityLogRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            logs = activityLogRepository.findAllByOrderByCreatedAtDesc();
        }

        return logs.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void logActivity(Company company, User actor, ActivityType actionType, FileItem targetFile, Map<String, Object> metadata) {
        try {
            Company comp = company != null ? company : (actor != null && actor.getCompany() != null ? actor.getCompany() : companyRepository.findAll().stream().findFirst().orElse(null));
            if (comp == null) {
                log.warn("Cannot log activity because no company exists");
                return;
            }

            ActivityLog activityLog = new ActivityLog();
            activityLog.setCompany(comp);
            activityLog.setActor(actor);
            activityLog.setActionType(actionType);
            activityLog.setTargetFile(targetFile);
            activityLog.setMetadata(metadata);
            activityLog.setCreatedAt(Instant.now());
            activityLogRepository.save(activityLog);
        } catch (Exception e) {
            log.error("Failed to log activity: {}", e.getMessage(), e);
        }
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !(authentication instanceof AnonymousAuthenticationToken)) {
            String email = authentication.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        String actorName = log.getActor() != null ? log.getActor().getName() : "Hệ thống";
        String targetName = "";
        if (log.getTargetFile() != null) {
            targetName = log.getTargetFile().getName();
        } else if (log.getMetadata() != null && log.getMetadata().containsKey("fileName")) {
            targetName = String.valueOf(log.getMetadata().get("fileName"));
        }
        String action = actionLabel(log.getActionType().name());
        String type = log.getActionType().name().toLowerCase();
        String timestamp = FMT.format(log.getCreatedAt());

        return new ActivityLogResponse(log.getId(), actorName, action, targetName, timestamp, type);
    }

    private String actionLabel(String type) {
        return switch (type) {
            case "UPLOAD"            -> "đã upload file";
            case "SHARE"             -> "đã chia sẻ file";
            case "DOWNLOAD"          -> "đã tải xuống file";
            case "DELETE"            -> "đã xóa file";
            case "UPDATE"            -> "đã khôi phục file";
            case "PERMISSION_CHANGE" -> "đã thay đổi quyền file";
            default                  -> "đã thao tác với file";
        };
    }
}
