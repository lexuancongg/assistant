package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ChatMessageCitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ChatCitationRepository extends JpaRepository<ChatMessageCitation, Long> {
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM ChatMessageCitation c WHERE c.file.id = :fileId")
    void deleteByFileId(@Param("fileId") Long fileId);
}
