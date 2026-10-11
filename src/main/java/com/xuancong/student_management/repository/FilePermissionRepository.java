package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.FilePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FilePermissionRepository extends JpaRepository<FilePermission, Long> {
    List<FilePermission> findByFileId(Long fileId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM FilePermission fp WHERE fp.file.id = :fileId")
    void deleteByFileIdDirect(@Param("fileId") Long fileId);
}
