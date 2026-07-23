package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.chat.ChatRequest;
import com.xuancong.student_management.dto.chat.ChatSessionResponse;
import com.xuancong.student_management.dto.chat.ChatSessionSummaryResponse;
import com.xuancong.student_management.dto.chat.ChatStatsResponse;
import com.xuancong.student_management.dto.chat.MessageAnswerResponse;
import com.xuancong.student_management.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<ChatSessionSummaryResponse>> listChatSessions(
            @RequestParam(required = false) Boolean favorite
    ) {
        return ResponseEntity.ok(this.chatService.listUserSessions(favorite));
    }

    @GetMapping("/personas")
    public ResponseEntity<List<String>> getPersonas() {
        return ResponseEntity.ok(this.chatService.getAssistantPersonas());
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<Void> setFavorite(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean favorite
    ) {
        this.chatService.markSessionFavorite(id, favorite);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<ChatStatsResponse> getChatStats() {
        return ResponseEntity.ok(this.chatService.getChatStats());
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
