package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.chat.*;
import com.xuancong.student_management.entity.ChatMessage;
import com.xuancong.student_management.entity.ChatMessageCitation;
import com.xuancong.student_management.entity.ChatSession;
import com.xuancong.student_management.entity.FileItem;
import com.xuancong.student_management.entity.FileTag;
import com.xuancong.student_management.entity.User;
import com.xuancong.student_management.entity.enums.ActivityType;
import com.xuancong.student_management.entity.enums.ChatRole;
import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.AgentExecutionTrace;
import com.xuancong.student_management.entity.AiTokenUsage;
import com.xuancong.student_management.entity.enums.AgentTraceStepType;
import com.xuancong.student_management.repository.AgentExecutionTraceRepository;
import com.xuancong.student_management.repository.AiTokenUsageRepository;
import com.xuancong.student_management.repository.ChatCitationRepository;
import com.xuancong.student_management.repository.ChatMessageFeedbackRepository;
import com.xuancong.student_management.repository.ChatMessageRepository;
import com.xuancong.student_management.repository.ChatSessionRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.UserRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatCitationRepository chatCitationRepository;
    private final UserRepository userRepository;
    private final FileItemRepository fileItemRepository;
    private final AiService aiService;
    private final FileManagementService fileManagementService;
    private final ActivityLogManagementService activityLogManagementService;
    private final AgentExecutionTraceRepository agentExecutionTraceRepository;
    private final AiTokenUsageRepository aiTokenUsageRepository;
    private final ChatMessageFeedbackRepository chatMessageFeedbackRepository;

    @Transactional
    public ChatSessionResponse getChatSession(Long sessionId) {
        return chatSessionRepository.findById(sessionId)
                .map(session -> {
                    List<ChatMessage> messages = chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(session.getId());
                    List<Long> messageIds = messages.stream().map(ChatMessage::getId).filter(Objects::nonNull).toList();
                    Map<Long, String> feedbackMap = Map.of();
                    if (!messageIds.isEmpty()) {
                        feedbackMap = chatMessageFeedbackRepository.findByMessage_IdIn(messageIds).stream()
                                .filter(fb -> fb.getMessage() != null && fb.getMessage().getId() != null)
                                .collect(Collectors.toMap(
                                        fb -> fb.getMessage().getId(),
                                        fb -> fb.getRating() != null ? fb.getRating().name() : "LIKE",
                                        (existing, replace) -> existing
                                ));
                    }
                    Map<Long, String> finalFeedbackMap = feedbackMap;
                    return ChatSessionResponse.builder()
                            .session(session.getId().toString())
                            .messages(
                                    messages.stream()
                                            .map(m -> ChatSessionResponse.Messages.fromChatMessage(m, finalFeedbackMap.get(m.getId())))
                                            .toList()
                            )
                            .build();
                })
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
                            .sessionId(session.getId())
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
    public void deleteSession(Long sessionId) {
        if (sessionId == null || !chatSessionRepository.existsById(sessionId)) {
            return;
        }

        // Lấy danh sách message IDs thuộc session này
        List<Long> messageIds = chatMessageRepository
                .findBySession_IdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(ChatMessage::getId)
                .toList();

        if (!messageIds.isEmpty()) {
            // Xóa các bảng con tham chiếu đến chat_messages (không có cascade ở DB)
            aiTokenUsageRepository.deleteByMessage_IdIn(messageIds);
            agentExecutionTraceRepository.deleteByMessage_IdIn(messageIds);
            chatMessageFeedbackRepository.deleteByMessage_IdIn(messageIds);
        }

        // Xóa session (cascade ALL sẽ tự xóa chat_messages + citations)
        chatSessionRepository.deleteById(sessionId);
    }

    public ChatStatsResponse getChatStats() {
        long totalSessions = chatSessionRepository.count();
        long totalMessages = chatMessageRepository.count();
        long totalUsers = chatSessionRepository.countDistinctUserIds();
        return new ChatStatsResponse(totalSessions, totalMessages, totalUsers, 0L);
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
                Long sessionLong = Long.parseLong(chatRequest.sessionId());
                chatSession = chatSessionRepository.findById(sessionLong).orElse(null);
            } catch (NumberFormatException ignored) {
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
        List<String> allowedDocumentIds = new ArrayList<>();
        try {
            List<FileItem> allActiveFiles = fileItemRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
            final User finalUser = currentUser;

            // Permission-Aware RAG: Chỉ nạp các tài liệu mà người dùng có quyền VIEWER
            List<FileItem> activeFiles = allActiveFiles.stream()
                    .filter(f -> fileManagementService.hasFileAccess(f, finalUser, PermissionLevel.VIEWER))
                    .toList();

            String targetFileId = chatRequest.fileId();
            if (targetFileId != null && !targetFileId.isBlank()) {
                try {
                    Long targetLong = Long.parseLong(targetFileId);
                    FileItem targetFile = fileItemRepository.findById(targetLong).orElse(null);
                    if (targetFile != null && !fileManagementService.hasFileAccess(targetFile, finalUser, PermissionLevel.VIEWER)) {
                        activityLogManagementService.logActivity(
                                targetFile.getCompany(),
                                finalUser,
                                ActivityType.AI_QUERY_BLOCKED,
                                targetFile,
                                Map.of("reason", "Người dùng không có quyền truy cập tài liệu qua AI", "attemptedQuery", question)
                        );
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền tra cứu nội dung từ tài liệu này qua AI");
                    }
                    allowedDocumentIds = List.of(targetFileId);
                } catch (ResponseStatusException rse) {
                    throw rse;
                } catch (Exception ignored) {
                    allowedDocumentIds = List.of(targetFileId);
                }
            } else if (chatRequest.documentId() != null && chatRequest.documentId() > 0) {
                allowedDocumentIds = List.of(String.valueOf(chatRequest.documentId()));
            } else {
                allowedDocumentIds = activeFiles.stream()
                        .map(FileItem::getId)
                        .filter(Objects::nonNull)
                        .map(String::valueOf)
                        .distinct()
                        .toList();
            }

            if (!activeFiles.isEmpty()) {
                availableFiles = activeFiles.stream()
                        .map(f -> {
                            String name = f.getName();
                            String type = f.getFileType() != null ? f.getFileType().toUpperCase() : "FILE";
                            long numId = f.getId() != null ? f.getId() : 0L;
                            String tagStr = "";
                            if (f.getTags() != null && !f.getTags().isEmpty()) {
                                String joined = f.getTags().stream()
                                        .map(FileTag::getTag)
                                        .filter(Objects::nonNull)
                                        .collect(Collectors.joining(", "));
                                if (!joined.isBlank()) {
                                    tagStr = " [Tags: " + joined + "]";
                                }
                            }
                            return name + tagStr + " [DocID: " + numId + "] (" + type + ")";
                        })
                        .toList();
            }
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("Error resolving active files for chat: {}", e.getMessage());
        }

        String mode = (chatRequest.mode() != null && chatRequest.mode().toUpperCase().contains("AGENTIC"))
                ? "AGENTIC_WORKFLOW"
                : "STANDARD_RAG";
        String modelProvider = chatRequest.modelProvider() != null ? chatRequest.modelProvider() : "gemini";

        long startTime = System.currentTimeMillis();
        RagResponse ragResponse = null;
        try {
            ragResponse = aiService.ask(
                    RagRequest.builder()
                            .documentId(chatRequest.documentId())
                            .question(question)
                            .history(history)
                            .availableFiles(availableFiles)
                            .mode(mode)
                            .modelProvider(modelProvider)
                            .allowedDocumentIds(allowedDocumentIds)
                            .build()
            );
        } catch (Exception e) {
            log.error("AI service ask failed: {}", e.getMessage(), e);
        }
        int latencyMs = (int) Math.max(1, System.currentTimeMillis() - startTime);

        String answerText = ragResponse != null && ragResponse.answer() != null
                ? ragResponse.answer()
                : "Hệ thống AI đã nhận được câu hỏi của bạn: \"" + question + "\". Dữ liệu đang được phân tích.";

        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setSession(chatSession);
        assistantMessage.setRole(ChatRole.ASSISTANT);
        assistantMessage.setContent(answerText);
        assistantMessage.setLatencyMs(latencyMs);
        chatMessageRepository.save(assistantMessage);

        // 1. Persist Reasoning Traces to DB
        if (ragResponse != null && ragResponse.reasoningTrace() != null) {
            int order = 1;
            for (RagResponse.AgentTraceStepResponse step : ragResponse.reasoningTrace()) {
                AgentExecutionTrace trace = new AgentExecutionTrace();
                trace.setMessage(assistantMessage);
                trace.setStepOrder(order++);
                try {
                    trace.setAgentName(AgentTraceStepType.valueOf(step.agentName().toUpperCase()));
                } catch (Exception e) {
                    trace.setAgentName(AgentTraceStepType.INTENT_ROUTER);
                }
                trace.setActionDescription(step.action());
                trace.setOutputPayload(step.outputSummary());
                trace.setLatencyMs(latencyMs / Math.max(1, ragResponse.reasoningTrace().size()));
                agentExecutionTraceRepository.save(trace);
            }
        }

        // 2. Persist Token Usage — use real counts from Gemini API if available, else estimate
        int promptTokens;
        int completionTokens;
        int totalTokens;
        if (ragResponse != null && ragResponse.promptTokens() != null && ragResponse.totalTokens() != null) {
            // Real token counts from Gemini usage_metadata
            promptTokens = ragResponse.promptTokens();
            completionTokens = ragResponse.completionTokens() != null ? ragResponse.completionTokens() : 0;
            totalTokens = ragResponse.totalTokens();
        } else {
            // Fallback estimation for DeepSeek or when token data unavailable
            promptTokens = Math.max(50, (question != null ? question.length() : 0) * 2 + (answerText.length() / 2));
            completionTokens = Math.max(20, answerText.length() / 3);
            totalTokens = promptTokens + completionTokens;
        }
        BigDecimal costUsd = BigDecimal.valueOf(totalTokens * 0.000002);

        if (currentUser != null) {
            AiTokenUsage tokenUsage = new AiTokenUsage();
            tokenUsage.setCompany(currentUser.getCompany());
            tokenUsage.setDepartment(currentUser.getDepartment());
            tokenUsage.setUser(currentUser);
            tokenUsage.setMessage(assistantMessage);
            tokenUsage.setModelName(modelProvider != null ? modelProvider : "gemini-1.5-pro");
            tokenUsage.setPromptTokens(promptTokens);
            tokenUsage.setCompletionTokens(completionTokens);
            tokenUsage.setTotalTokens(totalTokens);
            tokenUsage.setCostUsd(costUsd);
            aiTokenUsageRepository.save(tokenUsage);
        }

        // 3. Persist Citations to DB (phục vụ tính RAG Accuracy & Top tài liệu trích dẫn)
        List<MessageAnswerResponse.SourceCitationResponse> sources = new ArrayList<>();
        if (ragResponse != null && ragResponse.sources() != null && !ragResponse.sources().isEmpty()) {
            for (RagResponse.SourceChunk sc : ragResponse.sources()) {
                Long docId = sc.getDocIdLong();
                FileItem file = null;
                if (docId != null) {
                    file = fileItemRepository.findById(docId).orElse(null);
                }
                if (file == null) {
                    file = fileItemRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream().findFirst().orElse(null);
                }

                float scoreVal = sc.score() != null ? sc.score().floatValue() : 0.85f;
                if (scoreVal > 1.0f && scoreVal <= 100.0f) {
                    scoreVal = scoreVal / 100.0f;
                }

                if (file != null) {
                    ChatMessageCitation citation = new ChatMessageCitation();
                    citation.setMessage(assistantMessage);
                    citation.setFile(file);
                    citation.setChunkId(sc.chunkId() != null ? sc.chunkId() : "chunk-" + (sc.chunkIndex() != null ? sc.chunkIndex() : 1));
                    citation.setPageLabel(sc.chunkIndex() != null ? "Đoạn " + sc.chunkIndex() : "Trích dẫn");
                    citation.setScore(scoreVal);
                    chatCitationRepository.save(citation);
                }

                sources.add(new MessageAnswerResponse.SourceCitationResponse(
                        docId != null ? docId : (file != null ? file.getId() : null),
                        sc.chunkId(),
                        sc.chunkIndex(),
                        sc.content(),
                        sc.score()
                ));
            }
        } else if (ragResponse != null && ragResponse.groundednessScore() != null && ragResponse.groundednessScore() > 0) {
            FileItem file = fileItemRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream().findFirst().orElse(null);
            if (file != null) {
                float scoreVal = ragResponse.groundednessScore().floatValue();
                if (scoreVal > 1.0f && scoreVal <= 100.0f) {
                    scoreVal = scoreVal / 100.0f;
                }
                ChatMessageCitation citation = new ChatMessageCitation();
                citation.setMessage(assistantMessage);
                citation.setFile(file);
                citation.setChunkId("chunk-grounded-" + assistantMessage.getId());
                citation.setPageLabel("Đoạn tổng hợp");
                citation.setScore(scoreVal);
                chatCitationRepository.save(citation);
            }
        }

        List<MessageAnswerResponse.AgentTraceStepResponse> traces = new ArrayList<>();
        if (ragResponse != null && ragResponse.reasoningTrace() != null) {
            traces = ragResponse.reasoningTrace().stream()
                    .map(t -> new MessageAnswerResponse.AgentTraceStepResponse(
                            t.agentName(),
                            t.action(),
                            t.outputSummary(),
                            t.status()
                    ))
                    .toList();
        }

        return new MessageAnswerResponse(
                chatSession.getId().toString(),
                chatSession.getId(),
                assistantMessage.getId().toString(),
                assistantMessage.getContent(),
                sources,
                ragResponse != null && ragResponse.mode() != null ? ragResponse.mode() : mode,
                ragResponse != null ? ragResponse.intent() : null,
                ragResponse != null ? ragResponse.groundednessScore() : null,
                traces
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
