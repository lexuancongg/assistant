package com.xuancong.student_management.repository;

import com.xuancong.student_management.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    Optional<ChatSession> findByUser_IdAndDocument_Id(Long userId, Long documentId);
    List<ChatSession> findByUser_Id(Long userId);
    List<ChatSession> findByUser_IdAndFavoriteTrue(Long userId);

    @Query("select count(distinct cs.user.id) from ChatSession cs")
    long countDistinctUserIds();

    long countByFavoriteTrue();
}
