package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    List<ActivityLog> findAllByOrderByCreatedAtDesc();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE ActivityLog a SET a.targetFile = null WHERE a.targetFile.id = :fileId")
    void detachTargetFile(@Param("fileId") Long fileId);
}
