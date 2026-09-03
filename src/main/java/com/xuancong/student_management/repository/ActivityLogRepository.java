package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    List<ActivityLog> findAllByOrderByCreatedAtDesc();
}
