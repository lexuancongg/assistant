package com.xuancong.student_management.repository;

import com.xuancong.student_management.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.ZonedDateTime;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice,Long> {
    long countByCreatedAtBetween(ZonedDateTime start, ZonedDateTime end);
    Optional<Invoice> findByDocumentId(Long documentId);
}
