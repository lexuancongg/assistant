package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.FolderPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FolderPermissionRepository extends JpaRepository<FolderPermission, UUID> {
    List<FolderPermission> findByFolderId(Long folderId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM FolderPermission fp WHERE fp.folder.id = :folderId")
    void deleteByFolderIdDirect(@Param("folderId") Long folderId);
}