package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ChatMessageCitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatCitationRepository extends JpaRepository<ChatMessageCitation, Long> {
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM ChatMessageCitation c WHERE c.file.id = :fileId")
    void deleteByFileId(@Param("fileId") Long fileId);

    @Query("SELECT c.file.name FROM ChatMessageCitation c WHERE c.message.session.id = :sessionId ORDER BY c.id ASC")
    List<String> findCitationFileNamesBySessionId(@Param("sessionId") Long sessionId);
}
