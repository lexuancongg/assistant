package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.chat.*;
import com.xuancong.student_management.entity.ChatMessage;
import com.xuancong.student_management.entity.ChatSession;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.ChatRole;
import com.xuancong.student_management.repository.ChatCitationRepository;
import com.xuancong.student_management.repository.ChatMessageRepository;
import com.xuancong.student_management.repository.ChatSessionRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatCitationRepository chatCitationRepository;
    private final UserRepository userRepository;
    private final FileItemRepository fileItemRepository;
    private final AiService aiService;

    @Transactional
    public ChatSessionResponse getChatSession(UUID sessionId) {
        return chatSessionRepository.findById(sessionId)
                .map(session -> ChatSessionResponse.builder()
                        .session(session.getId().toString())
                        .messages(
                                chatMessageRepository
                                        .findBySession_IdOrderByCreatedAtAsc(session.getId())
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
        List<ChatSession> sessions = currentUser != null
                ? chatSessionRepository.findByUser_IdOrderByCreatedAtDesc(currentUser.getId())
                : chatSessionRepository.findAllByOrderByCreatedAtDesc();

        return sessions.stream()
                .map(session -> {
                    int messageCount = chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(session.getId()).size();
                    return ChatSessionSummaryResponse.builder()
                            .id(session.getId().toString())
                            .sessionId(session.getId().getMostSignificantBits() & Long.MAX_VALUE)
                            .title(session.getTitle())
                            .assistantPersona("Trợ lý AI")
                            .favorite(false)
                            .messageCount(messageCount)
                            .build();
                })
                .toList();
    }

    public void markSessionFavorite(Long sessionId, boolean favorite) {
        // favorite toggle stub
    }

    @Transactional
    public void deleteSession(UUID sessionId) {
        if (sessionId != null && chatSessionRepository.existsById(sessionId)) {
            chatSessionRepository.deleteById(sessionId);
        }
    }

    public ChatStatsResponse getChatStats() {
        long totalSessions = chatSessionRepository.count();
        long totalMessages = chatMessageRepository.count();
        long totalUsers = chatSessionRepository.countDistinctUserIds();
        return new ChatStatsResponse(totalSessions, totalMessages, totalUsers, 0L);
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

    @Transactional
    public MessageAnswerResponse questionAnswer(ChatRequest chatRequest) {
        String question = chatRequest.question();
        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("question is required");
        }

        User currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            currentUser = userRepository.findAll().stream().findFirst().orElse(null);
        }

        ChatSession chatSession = null;
        if (chatRequest.sessionId() != null && !chatRequest.sessionId().isBlank()) {
            try {
                UUID sessionUuid = UUID.fromString(chatRequest.sessionId());
                chatSession = chatSessionRepository.findById(sessionUuid).orElse(null);
            } catch (IllegalArgumentException ignored) {
            }
        }

        if (chatSession == null) {
            chatSession = new ChatSession();
            chatSession.setTitle(generateSessionTitle(question));
            chatSession.setUser(currentUser);
            chatSession = chatSessionRepository.save(chatSession);
        }

        ChatMessage userMessage = new ChatMessage();
        userMessage.setSession(chatSession);
        userMessage.setRole(ChatRole.USER);
        userMessage.setContent(question);
        chatMessageRepository.save(userMessage);

        List<RagRequest.ChatHistoryMessage> history = chatMessageRepository
                .findBySession_IdOrderByCreatedAtAsc(chatSession.getId())
                .stream()
                .filter(m -> !m.getId().equals(userMessage.getId()))
                .map(m -> new RagRequest.ChatHistoryMessage(
                        m.getRole() != null ? m.getRole().name() : "USER",
                        m.getContent()
                ))
                .toList();

        List<String> availableFiles = new ArrayList<>();
        try {
            List<FileItem> activeFiles = (currentUser != null && currentUser.getCompany() != null)
                    ? fileItemRepository.findByCompanyIdAndDeletedAtIsNull(currentUser.getCompany().getId())
                    : fileItemRepository.findByDeletedAtIsNull();

            if (activeFiles != null) {
                availableFiles = activeFiles.stream()
                        .map(f -> {
                            String name = f.getName();
                            String type = f.getFileType() != null ? f.getFileType().toUpperCase() : "FILE";
                            return name + " (" + type + ")";
                        })
                        .toList();
            }
        } catch (Exception ignored) {
        }

        RagResponse ragResponse = null;
        try {
            ragResponse = aiService.ask(
                    RagRequest.builder()
                            .documentId(chatRequest.documentId())
                            .question(question)
                            .persona(chatRequest.persona())
                            .history(history)
                            .availableFiles(availableFiles)
                            .build()
            );
        } catch (Exception e) {
            // fallback
        }

        String answerText = ragResponse != null && ragResponse.answer() != null
                ? ragResponse.answer()
                : "Hệ thống AI đã nhận được câu hỏi của bạn: \"" + question + "\". Dữ liệu đang được phân tích.";

        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setSession(chatSession);
        assistantMessage.setRole(ChatRole.ASSISTANT);
        assistantMessage.setContent(answerText);
        chatMessageRepository.save(assistantMessage);

        return new MessageAnswerResponse(
                chatSession.getId().toString(),
                chatSession.getId().getMostSignificantBits() & Long.MAX_VALUE,
                assistantMessage.getContent(),
                new ArrayList<>()
        );
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        String username = authentication.getName();
        return userRepository.findByEmail(username).orElse(null);
    }

    private String generateSessionTitle(String firstQuestion) {
        if (firstQuestion == null || firstQuestion.isBlank()) return "Cuộc trò chuyện mới";
        return firstQuestion.length() > 50
                ? firstQuestion.substring(0, 50) + "..."
                : firstQuestion;
    }
}
