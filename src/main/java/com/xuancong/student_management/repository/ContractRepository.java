package com.xuancong.student_management.repository;

import com.xuancong.student_management.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.ZonedDateTime;
import java.util.Optional;

public interface ContractRepository extends JpaRepository<Contract, Long> {
    long countByCreatedAtBetween(ZonedDateTime start, ZonedDateTime end);

    Optional<Contract> findByDocumentId(Long documentId);
}
