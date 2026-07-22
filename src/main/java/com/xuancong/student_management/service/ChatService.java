package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.chat.*;
import com.xuancong.student_management.enums.MessageRole;
import com.xuancong.student_management.model.*;
import com.xuancong.student_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DocumentRepository documentRepository;
    private final AiService aiService;
    private final DocumentChunkRepository documentChunkRepository;
    private final ChatCitationRepository chatCitationRepository;

    public ChatSessionResponse getChatSession(Long docId) {
        Long userId = 5L;

        return chatSessionRepository
                .findByUser_IdAndDocument_Id(userId, docId)
                .map(session -> ChatSessionResponse.builder()
                        .session(session.getId())
                        .messages(
                                chatMessageRepository
                                        .findBySessionIdOrderByCreatedAtAsc(session.getId())
                                        .stream()
                                        .map(ChatSessionResponse.Messages::fromChatMessage)
                                        .toList()
                        )
                        .build())
                .orElseGet(() -> ChatSessionResponse.builder()
                        .session(null)
                        .messages(List.of())
                        .build());
    }

    public MessageAnswerResponse questionAnswer(ChatRequest chatRequest){
        Long sessionId = chatRequest.sessionId();
        Long documentId = chatRequest.documentId();
        Document document = documentRepository.findById(documentId)
                .orElse(null);
        ChatSession chatSession = null;
//        if (sessionId == null) {
//
//            chatSession = ChatSession.builder()
//                    .title(this.generateSessionTitle(chatRequest.question())) // tự đặt tiêu đề từ câu hỏi đầu
//                    .user(new User())
//                    .document(document)
//                    .build();
//            chatSession = chatSessionRepository.save(chatSession);
//        } else {
//            chatSession = chatSessionRepository.findById(sessionId)
//                    .orElseThrow(() -> new RuntimeException("Chat session not found: " + sessionId));
//        }
//
//        ChatMessage userMessage = ChatMessage.builder()
//                .session(chatSession)
//                .role(MessageRole.USER)
//                .content(chatRequest.question())
//                .build();
//
//        chatMessageRepository.save(userMessage);
        RagResponse ragResponse = aiService.ask(
                RagRequest.builder()
                        .documentId(documentId)
                        .question(chatRequest.question())
                        .build()
        );


        System.out.println(ragResponse.answer());

        // 4. Lưu question trả lời của AI
        ChatMessage assistantMessage = ChatMessage.builder()
                .session(chatSession)
                .role(MessageRole.AI)
                .content(ragResponse.answer())
                .build();
        chatMessageRepository.save(assistantMessage);

        // 5. Lưu các citation (nguồn trích dẫn) gắn với question vừa trả lời
        if (ragResponse.sources() != null) {
            for (RagResponse.SourceChunk source : ragResponse.sources()) {
                documentChunkRepository.findByEmbeddingId(source.chunkId()).ifPresent(chunk -> {
                    ChatCitation citation = ChatCitation.builder()
                            .message(assistantMessage)
                            .chunk(chunk)
                            .similarityScore(source.score())
                            .build();
                    chatCitationRepository.save(citation);
                });
            }
        }

        // 6. Trả kết quả về cho frontend
        return new MessageAnswerResponse(
                chatSession.getId(),
//                assistantMessage.getId(),
                assistantMessage.getContent()
//                ragResponse.sources()
        );
    }

    private String generateSessionTitle(String firstQuestion) {
        if (firstQuestion == null || firstQuestion.isBlank()) return "Cuộc trò chuyện mới";
        return firstQuestion.length() > 50
                ? firstQuestion.substring(0, 50) + "..."
                : firstQuestion;
    }




}
