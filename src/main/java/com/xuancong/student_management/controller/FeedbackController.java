package com.xuancong.student_management.controller;

import com.xuancong.student_management.dto.chat.FeedbackRequestDto;
import com.xuancong.student_management.dto.chat.FeedbackResponseDto;
import com.xuancong.student_management.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat/messages")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/{messageId}/feedback")
    public ResponseEntity<FeedbackResponseDto> submitFeedback(
            @PathVariable Long messageId,
            @RequestBody FeedbackRequestDto dto
    ) {
        FeedbackResponseDto response = feedbackService.submitFeedback(messageId, dto);
        return ResponseEntity.ok(response);
    }
}
