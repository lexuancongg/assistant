package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.chat.FeedbackRequestDto;
import com.xuancong.student_management.dto.chat.FeedbackResponseDto;
import com.xuancong.student_management.entity.ChatMessage;
import com.xuancong.student_management.entity.ChatMessageFeedback;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.repository.ChatMessageFeedbackRepository;
import com.xuancong.student_management.repository.ChatMessageRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final ChatMessageFeedbackRepository feedbackRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Transactional
    public FeedbackResponseDto submitFeedback(Long messageId, FeedbackRequestDto dto) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin nhắn: " + messageId));

        User currentUser = resolveCurrentUser();
        if (currentUser == null) {
            // Default to session user if available
            currentUser = message.getSession().getUser();
        }

        ChatMessageFeedback feedback = feedbackRepository.findByMessage_Id(messageId)
                .orElse(new ChatMessageFeedback());

        feedback.setMessage(message);
        feedback.setUser(currentUser);
        feedback.setRating(dto.rating());
        feedback.setFeedbackReason(dto.reason());
        feedback.setComment(dto.comment());
        feedback.setCorrectedAnswer(dto.correctedAnswer());
        feedback.setCreatedAt(Instant.now());

        ChatMessageFeedback saved = feedbackRepository.save(feedback);
        log.info("Saved feedback for message {}: {} by user {}", messageId, dto.rating(), currentUser.getEmail());

        return new FeedbackResponseDto(
                saved.getId(),
                message.getId(),
                currentUser.getId(),
                currentUser.getName(),
                saved.getRating(),
                saved.getFeedbackReason(),
                saved.getComment(),
                saved.getCorrectedAnswer(),
                saved.getCreatedAt()
        );
    }

    private User resolveCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                return userRepository.findByEmail(auth.getName()).orElse(null);
            }
        } catch (Exception ignored) {}
        return null;
    }
}
