package com.xuancong.student_management.repository;

import com.xuancong.student_management.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findByUser_IdAndDocument_Id(Long userId, Long documentId);
}
