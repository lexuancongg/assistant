package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.FileExtraction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FileExtractionRepository extends JpaRepository<FileExtraction, Long> {
    Optional<FileExtraction> findTopByFile_IdOrderByUpdatedAtDesc(Long fileId);
    void deleteByFile_Id(Long fileId);
}
