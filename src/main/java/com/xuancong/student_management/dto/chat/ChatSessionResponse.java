package com.xuancong.student_management.dto.chat;

import com.xuancong.student_management.enums.MessageRole;
import com.xuancong.student_management.model.ChatMessage;
import lombok.Builder;

import java.util.List;
@Builder
public record ChatSessionResponse(
        Long session,
        List<Messages> messages
) {
    @Builder
    public static record Messages(
            MessageRole role,
            String content
    ){

        public static Messages fromChatMessage(ChatMessage chatMessage) {
            return Messages.builder()
                    .role(chatMessage.getRole())
                    .content(chatMessage.getContent())
                    .build();
        }
    }
}
