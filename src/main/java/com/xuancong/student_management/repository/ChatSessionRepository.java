package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUser_Id(Long userId);
    List<ChatSession> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<ChatSession> findAllByOrderByCreatedAtDesc();

    @Query("select count(distinct cs.user.id) from ChatSession cs")
    long countDistinctUserIds();
}
