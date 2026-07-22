package com.xuancong.student_management.dto.chat;

public record ChatRequest(
        Long sessionId,
        Long documentId,
        String question
) {

}
