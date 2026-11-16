package com.xuancong.student_management.dto.chat;

import com.xuancong.student_management.entity.ChatMessage;
import lombok.Builder;

import java.util.List;

@Builder
public record ChatSessionResponse(
        String session,
        List<Messages> messages
) {
    @Builder
    public static record Messages(
            Long id,
            Long messageId,
            String role,
            String content
    ){
        public static Messages fromChatMessage(ChatMessage chatMessage) {
            return Messages.builder()
                    .id(chatMessage.getId())
                    .messageId(chatMessage.getId())
                    .role(chatMessage.getRole() != null ? chatMessage.getRole().name() : "USER")
                    .content(chatMessage.getContent())
                    .build();
        }

        public static Messages fromChatMessage(ChatMessage chatMessage, String feedbackRating) {
            return fromChatMessage(chatMessage);
        }
    }
}
