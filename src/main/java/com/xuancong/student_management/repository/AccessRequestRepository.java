package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.AccessRequest;
import com.xuancong.student_management.entity.enums.AccessRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccessRequestRepository extends JpaRepository<AccessRequest, UUID> {
    List<AccessRequest> findByStatusOrderByCreatedAtDesc(AccessRequestStatus status);
    List<AccessRequest> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);
    long countByStatus(AccessRequestStatus status);
}