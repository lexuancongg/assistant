package com.xuancong.student_management.repository;

import com.xuancong.student_management.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.ZonedDateTime;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    long countByCreatedAtBetween(ZonedDateTime start, ZonedDateTime end);
}
