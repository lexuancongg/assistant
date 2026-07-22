package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.chat.ChatRequest;
import com.xuancong.student_management.dto.chat.ChatSessionResponse;
import com.xuancong.student_management.dto.chat.MessageAnswerResponse;
import com.xuancong.student_management.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat-sessions")
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/document/{id}")
    public ResponseEntity<ChatSessionResponse> getChatSession(@PathVariable Long id) {
        return ResponseEntity.ok(
                this.chatService.getChatSession(id)
        );
    }

    @PostMapping("/ask")
    public ResponseEntity<MessageAnswerResponse> questionAnswer(
            @RequestBody ChatRequest chatRequest
            ){
        return ResponseEntity.ok(
                this.chatService.questionAnswer(chatRequest)
        );
    }


}
