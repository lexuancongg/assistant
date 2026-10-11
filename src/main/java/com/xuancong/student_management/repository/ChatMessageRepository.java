package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ChatMessage;
import com.xuancong.student_management.entity.enums.ChatRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySession_IdOrderByCreatedAtAsc(Long sessionId);
    long countByRole(ChatRole role);
    long countByRoleAndCreatedAtAfter(ChatRole role, Instant after);
    long countByRoleAndCreatedAtBetween(ChatRole role, Instant from, Instant to);
    long countByWasBlockedByPermissionTrue();

    @Query("SELECT AVG(m.latencyMs) FROM ChatMessage m WHERE m.role = com.xuancong.student_management.entity.enums.ChatRole.ASSISTANT AND m.latencyMs IS NOT NULL")
    Double findAverageLatency();

    List<ChatMessage> findByCreatedAtAfterOrderByCreatedAtAsc(Instant after);
}

