package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.AccessRequest;
import com.xuancong.student_management.entity.enums.AccessRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {
    List<AccessRequest> findByStatusOrderByCreatedAtDesc(AccessRequestStatus status);
    List<AccessRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);
    long countByStatus(AccessRequestStatus status);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AccessRequest a WHERE a.fileId = :fileId")
    void deleteByFileId(@org.springframework.data.repository.query.Param("fileId") Long fileId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM AccessRequest a WHERE a.fileId IS NOT NULL AND a.fileId NOT IN (SELECT f.id FROM FileItem f)")
    void cleanOrphanedFileRequests();
}