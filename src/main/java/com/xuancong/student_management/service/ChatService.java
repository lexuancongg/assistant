package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.chat.*;
import com.xuancong.student_management.enums.MessageRole;
import com.xuancong.student_management.model.ChatCitation;
import com.xuancong.student_management.model.ChatMessage;
import com.xuancong.student_management.model.ChatSession;
import com.xuancong.student_management.model.Document;
import com.xuancong.student_management.model.User;
import com.xuancong.student_management.repository.ChatCitationRepository;
import com.xuancong.student_management.repository.ChatMessageRepository;
import com.xuancong.student_management.repository.ChatSessionRepository;
import com.xuancong.student_management.repository.DocumentChunkRepository;
import com.xuancong.student_management.repository.DocumentRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DocumentRepository documentRepository;
    private final AiService aiService;
    private final DocumentChunkRepository documentChunkRepository;
    private final ChatCitationRepository chatCitationRepository;
    private final UserRepository userRepository;

    public ChatSessionResponse getChatSession(Long docId) {
        User currentUser = getAuthenticatedUser();

        return chatSessionRepository.findByUser_IdAndDocument_Id(currentUser.getId(), docId)
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

    public List<ChatSessionSummaryResponse> listUserSessions(Boolean favoriteOnly) {
        User currentUser = getAuthenticatedUser();
        List<ChatSession> sessions = favoriteOnly != null && favoriteOnly
                ? chatSessionRepository.findByUser_IdAndFavoriteTrue(currentUser.getId())
                : chatSessionRepository.findByUser_Id(currentUser.getId());

        return sessions.stream()
                .map(session -> {
                    int messageCount = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId()).size();
                    return ChatSessionSummaryResponse.builder()
                            .sessionId(session.getId())
                            .title(session.getTitle())
                            .assistantPersona(session.getAssistantPersona())
                            .favorite(Boolean.TRUE.equals(session.getFavorite()))
                            .documentId(session.getDocument() != null ? session.getDocument().getId() : null)
                            .documentName(session.getDocument() != null ? session.getDocument().getDocumentName() : null)
                            .messageCount(messageCount)
                            .build();
                })
                .toList();
    }

    public void markSessionFavorite(Long sessionId, boolean favorite) {
        User currentUser = getAuthenticatedUser();
        ChatSession session = chatSessionRepository.findById(sessionId)
                .filter(s -> s.getUser().getId().equals(currentUser.getId()))
                .orElseThrow(() -> new RuntimeException("Chat session not found for current user: " + sessionId));
        session.setFavorite(favorite);
        chatSessionRepository.save(session);
    }

    public ChatStatsResponse getChatStats() {
        long totalSessions = chatSessionRepository.count();
        long totalMessages = chatMessageRepository.count();
        long totalUsers = chatSessionRepository.countDistinctUserIds();
        long favoriteSessions = chatSessionRepository.countByFavoriteTrue();
        return new ChatStatsResponse(totalSessions, totalMessages, totalUsers, favoriteSessions);
    }

    public List<String> getAssistantPersonas() {
        return List.of(
                "Trợ lý pháp lý",
                "Trợ lý sales",
                "Trợ lý kỹ thuật",
                "Trợ lý hỗ trợ khách hàng",
                "Trợ lý tổng hợp doanh nghiệp"
        );
    }

    public MessageAnswerResponse questionAnswer(ChatRequest chatRequest){
        Long sessionId = chatRequest.sessionId();
        Long documentId = chatRequest.documentId();
        String question = chatRequest.question();
        String persona = chatRequest.persona();
        if (documentId == null) {
            throw new IllegalArgumentException("documentId is required");
        }
        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("question is required");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        User currentUser = getAuthenticatedUser();
        ChatSession chatSession;
        if (sessionId == null) {
            chatSession = chatSessionRepository
                    .findByUser_IdAndDocument_Id(currentUser.getId(), documentId)
                    .orElseGet(() -> createChatSession(currentUser, document, question, persona));
        } else {
            chatSession = chatSessionRepository.findById(sessionId)
                    .filter(session -> session.getUser().getId().equals(currentUser.getId()))
                    .orElseThrow(() -> new RuntimeException("Chat session not found for current user: " + sessionId));
            if (chatSession.getAssistantPersona() == null && persona != null && !persona.isBlank()) {
                chatSession.setAssistantPersona(persona);
                chatSessionRepository.save(chatSession);
            }
        }

        List<RagRequest.ChatHistoryMessage> history = null;
        if (chatRequest.history() != null && !chatRequest.history().isEmpty()) {
            history = chatRequest.history().stream()
                    .map(msg -> new RagRequest.ChatHistoryMessage(msg.role(), msg.content()))
                    .toList();
        }

        if (history == null || history.isEmpty()) {
            history = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(chatSession.getId())
                    .stream()
                    .map(msg -> new RagRequest.ChatHistoryMessage(msg.getRole().name(), msg.getContent()))
                    .toList();
        }

        ChatMessage userMessage = ChatMessage.builder()
                .session(chatSession)
                .role(MessageRole.USER)
                .content(question)
                .build();
        chatMessageRepository.save(userMessage);

        RagResponse ragResponse = aiService.ask(
                RagRequest.builder()
                        .documentId(documentId)
                        .question(question)
                        .persona(persona)
                        .history(history)
                        .build()
        );

        ChatMessage assistantMessage = ChatMessage.builder()
                .session(chatSession)
                .role(MessageRole.AI)
                .content(ragResponse.answer())
                .build();
        chatMessageRepository.save(assistantMessage);

        List<MessageAnswerResponse.SourceCitationResponse> citations = new java.util.ArrayList<>();

        if (ragResponse.sources() != null) {
            int rank = 0;
            for (RagResponse.SourceChunk source : ragResponse.sources()) {
                rank++;
                int currentRank = rank;
                documentChunkRepository.findByEmbeddingId(source.chunkId()).ifPresent(chunk -> {
                    ChatCitation citation = ChatCitation.builder()
                            .message(assistantMessage)
                            .chunk(chunk)
                            .similarityScore(source.score())
                            .rankOrder(currentRank)
                            .build();
                    chatCitationRepository.save(citation);
                    citations.add(new MessageAnswerResponse.SourceCitationResponse(
                            source.documentId(),
                            source.chunkId(),
                            chunk.getChunkIndex(),
                            chunk.getContent(),
                            source.score()
                    ));
                });
            }
        }

        return new MessageAnswerResponse(
                chatSession.getId(),
                assistantMessage.getContent(),
                citations
        );
    }

    private ChatSession createChatSession(User user, Document document, String firstQuestion, String persona) {
        ChatSession.ChatSessionBuilder builder = ChatSession.builder()
                .title(this.generateSessionTitle(firstQuestion))
                .user(user)
                .document(document)
                .assistantPersona(persona);

        if (persona != null && !persona.isBlank()) {
            builder.favorite(false);
        }

        return chatSessionRepository.save(builder.build());
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new RuntimeException("User is not authenticated");
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + username));
    }

    private String generateSessionTitle(String firstQuestion) {
        if (firstQuestion == null || firstQuestion.isBlank()) return "Cuộc trò chuyện mới";
        return firstQuestion.length() > 50
                ? firstQuestion.substring(0, 50) + "..."
                : firstQuestion;
    }
}

