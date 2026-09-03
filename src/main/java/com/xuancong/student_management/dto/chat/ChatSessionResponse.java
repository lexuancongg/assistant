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
            String role,
            String content
    ){

        public static Messages fromChatMessage(ChatMessage chatMessage) {
            return Messages.builder()
                    .role(chatMessage.getRole() != null ? chatMessage.getRole().name() : "USER")
                    .content(chatMessage.getContent())
                    .build();
        }
    }
}
