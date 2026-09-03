package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findBySession_IdOrderByCreatedAtAsc(UUID sessionId);
}
