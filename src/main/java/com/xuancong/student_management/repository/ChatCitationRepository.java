package com.xuancong.student_management.repository;

import com.xuancong.student_management.entity.ChatMessageCitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ChatCitationRepository extends JpaRepository<ChatMessageCitation, UUID> {
}
