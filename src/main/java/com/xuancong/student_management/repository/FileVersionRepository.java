package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.FileVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileVersionRepository extends JpaRepository<FileVersion, Long> {
    List<FileVersion> findByFile_IdOrderByVersionNoDesc(Long fileId);

    Optional<FileVersion> findTopByFile_IdOrderByVersionNoDesc(Long fileId);

    Optional<FileVersion> findByFile_IdAndId(Long fileId, Long versionId);
}
