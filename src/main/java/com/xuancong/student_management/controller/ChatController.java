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
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat-sessions")
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/document/{id}")
    public ResponseEntity<ChatSessionResponse> getChatSession(@PathVariable String id) {
        Long sessionId;
        try {
            sessionId = Long.parseLong(id);
        } catch (Exception e) {
            return ResponseEntity.ok(ChatSessionResponse.builder().session(null).messages(List.of()).build());
        }
        return ResponseEntity.ok(
                this.chatService.getChatSession(sessionId)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatSessionResponse> getChatSessionById(@PathVariable String id) {
        Long sessionId;
        try {
            sessionId = Long.parseLong(id);
        } catch (Exception e) {
            return ResponseEntity.ok(ChatSessionResponse.builder().session(null).messages(List.of()).build());
        }
        return ResponseEntity.ok(
                this.chatService.getChatSession(sessionId)
        );
    }

    @GetMapping
    public ResponseEntity<List<ChatSessionSummaryResponse>> listChatSessions(
            @RequestParam(required = false) Boolean favorite
    ) {
        return ResponseEntity.ok(this.chatService.listUserSessions(favorite));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<Void> setFavorite(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean favorite
    ) {
        this.chatService.markSessionFavorite(id, favorite);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable String id) {
        try {
            Long sessionId = Long.parseLong(id);
            this.chatService.deleteSession(sessionId);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }
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
