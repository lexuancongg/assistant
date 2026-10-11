package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    List<DocumentChunk> findByFile_IdOrderByChunkIndexAsc(Long fileId);
    Optional<DocumentChunk> findByPointId(String pointId);
    long countByFile_Company_IdAndIsActiveTrue(Long companyId);

    @Modifying
    @Query("DELETE FROM DocumentChunk d WHERE d.file.id = :fileId")
    void deleteByFileId(@Param("fileId") Long fileId);
}
