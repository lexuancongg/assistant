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
import com.xuancong.student_management.entity.enums.AgentTraceStepType;
import com.xuancong.student_management.repository.AgentExecutionTraceRepository;
import com.xuancong.student_management.repository.ChatCitationRepository;
import com.xuancong.student_management.repository.ChatMessageRepository;
import com.xuancong.student_management.repository.ChatSessionRepository;
import com.xuancong.student_management.repository.FileItemRepository;
import com.xuancong.student_management.repository.UserRepository;
import com.xuancong.student_management.entity.Folder;
import com.xuancong.student_management.repository.FolderRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatCitationRepository chatCitationRepository;
    private final UserRepository userRepository;
    private final FileItemRepository fileItemRepository;
    private final FolderRepository folderRepository;
    private final AiService aiService;
    private final FileManagementService fileManagementService;
    private final ActivityLogManagementService activityLogManagementService;
    private final AgentExecutionTraceRepository agentExecutionTraceRepository;
    private final com.xuancong.student_management.repository.DocumentChunkRepository documentChunkRepository;

    @Transactional
    public ChatSessionResponse getChatSession(Long sessionId) {
        return chatSessionRepository.findById(sessionId)
                .map(session -> {
                    List<ChatMessage> messages = chatMessageRepository.findBySession_IdOrderByCreatedAtAsc(session.getId());
                    return ChatSessionResponse.builder()
                            .session(session.getId().toString())
                            .messages(
                                    messages.stream()
                                            .map(msg -> ChatSessionResponse.Messages.builder()
                                                    .id(msg.getId())
                                                    .messageId(msg.getId())
                                                    .role(msg.getRole() != null ? msg.getRole().name() : "USER")
                                                    .content(resolveDocumentLinks(msg.getContent()))
                                                    .build())
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
                    String docName = session.getDocumentName();
                    if (docName == null || docName.isBlank()) {
                        try {
                            List<String> citationFileNames = chatCitationRepository.findCitationFileNamesBySessionId(session.getId());
                            if (citationFileNames != null && !citationFileNames.isEmpty()) {
                                docName = citationFileNames.get(0);
                            }
                        } catch (Exception ignored) {}
                    }
                    if (docName == null || docName.isBlank()) {
                        docName = "Toàn bộ Drive";
                    }

                    return ChatSessionSummaryResponse.builder()
                            .id(session.getId().toString())
                            .sessionId(session.getId())
                            .title(session.getTitle())
                            .assistantPersona("Trợ lý AI")
                            .favorite(false)
                            .documentName(docName)
                            .messageCount(messageCount)
                            .createdAt(session.getCreatedAt())
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
            agentExecutionTraceRepository.deleteByMessage_IdIn(messageIds);
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
    public OverviewResponse getOverview(OverviewRequest request) {
        User currentUser = getAuthenticatedUser();
        List<String> allowedDocumentIds = new ArrayList<>();
        String sourceName = request.getSourceName();

        try {
            List<FileItem> allActiveFiles = fileItemRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
            final User finalUser = currentUser;

            List<FileItem> activeFiles = allActiveFiles.stream()
                    .filter(f -> fileManagementService.hasFileAccess(f, finalUser, PermissionLevel.VIEWER))
                    .toList();

            String targetFileId = request.getFileId();
            if ((targetFileId == null || targetFileId.isBlank()) && request.getDocumentId() != null && request.getDocumentId() > 0) {
                targetFileId = String.valueOf(request.getDocumentId());
            }
            String targetFolderId = request.getFolderId();

            if (targetFileId != null && !targetFileId.isBlank()) {
                try {
                    Long targetLong = Long.parseLong(targetFileId);
                    FileItem targetFile = fileItemRepository.findById(targetLong).orElse(null);
                    if (targetFile != null && fileManagementService.hasFileAccess(targetFile, finalUser, PermissionLevel.VIEWER)) {
                        allowedDocumentIds = List.of(targetFileId);
                        request.setDocumentId(targetLong);
                        try {
                            List<com.xuancong.student_management.entity.DocumentChunk> dbChunks = documentChunkRepository.findByFile_IdOrderByChunkIndexAsc(targetLong);
                            if (dbChunks != null && !dbChunks.isEmpty()) {
                                String combinedText = dbChunks.stream()
                                        .limit(8)
                                        .map(com.xuancong.student_management.entity.DocumentChunk::getContent)
                                        .filter(Objects::nonNull)
                                        .collect(Collectors.joining("\n\n---\n\n"));
                                request.setContextText(combinedText);
                            }
                        } catch (Exception ex) {
                            log.warn("Could not load db chunks for overview file {}: {}", targetLong, ex.getMessage());
                        }
                        if (sourceName == null || sourceName.isBlank()) {
                            sourceName = targetFile.getName();
                        }
                    }
                } catch (Exception ignored) {}
            } else if (targetFolderId != null && !targetFolderId.isBlank() && !"all".equalsIgnoreCase(targetFolderId)) {
                try {
                    Long folderLong = Long.parseLong(targetFolderId);
                    Set<Long> targetFolderIds = getFolderAndSubFolderIds(folderLong);
                    List<FileItem> scopedFiles = activeFiles.stream()
                            .filter(f -> f.getFolder() != null && targetFolderIds.contains(f.getFolder().getId()))
                            .toList();

                    allowedDocumentIds = scopedFiles.stream()
                            .map(FileItem::getId)
                            .filter(Objects::nonNull)
                            .map(String::valueOf)
                            .distinct()
                            .toList();

                    if (sourceName == null || sourceName.isBlank()) {
                        Folder fld = folderRepository.findById(folderLong).orElse(null);
                        if (fld != null) sourceName = fld.getName();
                    }

                    // Thu thập các đoạn trích nội dung THỰC TẾ từ nhiều tài liệu khác nhau trong thư mục (Diversity Content Sampling)
                    List<String> contentSamples = new ArrayList<>();
                    for (FileItem file : scopedFiles) {
                        try {
                            List<com.xuancong.student_management.entity.DocumentChunk> chunks = 
                                    documentChunkRepository.findByFile_IdOrderByChunkIndexAsc(file.getId());
                            if (chunks != null && !chunks.isEmpty()) {
                                String sample = chunks.stream()
                                        .limit(2)
                                        .map(com.xuancong.student_management.entity.DocumentChunk::getContent)
                                        .filter(Objects::nonNull)
                                        .map(String::trim)
                                        .filter(s -> !s.isBlank())
                                        .collect(Collectors.joining(" "));
                                if (!sample.isBlank()) {
                                    if (sample.length() > 500) {
                                        sample = sample.substring(0, 500) + "...";
                                    }
                                    contentSamples.add("[Nội dung thực tế từ tài liệu: " + file.getName() + "]:\n" + sample);
                                }
                            }
                        } catch (Exception ex) {
                            log.debug("Skip chunk sample for file {}: {}", file.getId(), ex.getMessage());
                        }
                        if (contentSamples.size() >= 8) break; // Lấy mẫu nội dung từ tối đa 8 tài liệu khác nhau
                    }

                    if (!contentSamples.isEmpty()) {
                        request.setContextText(String.join("\n\n---\n\n", contentSamples));
                    }
                } catch (Exception ignored) {}
            } else {
                allowedDocumentIds = activeFiles.stream()
                        .map(FileItem::getId)
                        .filter(Objects::nonNull)
                        .map(String::valueOf)
                        .distinct()
                        .toList();
                if (sourceName == null || sourceName.isBlank()) {
                    sourceName = "Toàn bộ Drive";
                }
            }
        } catch (Exception e) {
            log.warn("Error resolving active files for overview: {}", e.getMessage());
        }

        request.setAllowedDocumentIds(allowedDocumentIds);
        request.setSourceName(sourceName != null ? sourceName : "Tài liệu");
        if (currentUser != null) {
            if (currentUser.getDepartment() != null) request.setDepartmentId(currentUser.getDepartment().getId());
            if (currentUser.getCompany() != null) request.setCompanyId(currentUser.getCompany().getId());
        }

        try {
            return aiService.getOverview(request);
        } catch (Exception e) {
            log.error("AI service getOverview failed: {}", e.getMessage());
            return OverviewResponse.builder()
                    .summary("Các tài liệu thuộc mục \"" + (sourceName != null ? sourceName : "Tài liệu") + "\" đã sẵn sàng hỗ trợ bạn tra cứu, tóm tắt và đối chiếu số liệu.")
                    .suggestedQuestions(List.of(
                            "Tóm tắt các điểm trọng tâm nhất trong " + (sourceName != null ? sourceName : "tài liệu") + ".",
                            "Liệt kê các số liệu hoặc quyết định quan trọng được ghi nhận.",
                            "Đưa ra các câu hỏi thường gặp liên quan đến tài liệu này."
                    ))
                    .build();
        }
    }

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

        List<RagRequest.ChatHistoryMessage> history = new ArrayList<>(
                chatMessageRepository
                        .findBySession_IdOrderByCreatedAtAsc(chatSession.getId())
                        .stream()
                        .filter(m -> !m.getId().equals(userMessage.getId()))
                        .map(m -> new RagRequest.ChatHistoryMessage(
                                m.getRole() != null ? m.getRole().name() : "USER",
                                m.getContent()
                        ))
                        .toList()
        );

        // Fallback: Nếu DB history của session này rỗng nhưng client có gửi kèm history (multi-turn chat)
        if (history.isEmpty() && chatRequest.history() != null && !chatRequest.history().isEmpty()) {
            history = chatRequest.history().stream()
                    .filter(h -> h != null && h.content() != null && !h.content().isBlank())
                    .map(h -> new RagRequest.ChatHistoryMessage(
                            h.role() != null ? h.role().toUpperCase() : "USER",
                            h.content()
                    ))
                    .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        }

        // Giới hạn ngữ cảnh (tối đa 10 tin nhắn gần nhất) để tối ưu token RAG
        if (history.size() > 10) {
            history = new ArrayList<>(history.subList(history.size() - 10, history.size()));
        }

        List<String> allowedDocumentIds = new ArrayList<>();
        String folderName = null;
        List<String> subFolderNames = new ArrayList<>();
        List<String> availableFiles = new ArrayList<>();

        try {
            List<FileItem> allActiveFiles = fileItemRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
            final User finalUser = currentUser;

            // Permission-Aware RAG: Chỉ nạp các tài liệu mà người dùng có quyền VIEWER
            List<FileItem> activeFiles = allActiveFiles.stream()
                    .filter(f -> fileManagementService.hasFileAccess(f, finalUser, PermissionLevel.VIEWER))
                    .toList();

            String targetFileId = chatRequest.fileId();
            if ((targetFileId == null || targetFileId.isBlank()) && chatRequest.documentId() != null && chatRequest.documentId() > 0) {
                targetFileId = String.valueOf(chatRequest.documentId());
            }
            String targetFolderId = chatRequest.folderId();

            if (targetFileId != null && !targetFileId.isBlank()) {
                // =========================================================================
                // TRƯỜNG HỢP 1: Hỏi đích danh theo 1 TÀI LIỆU (File)
                // =========================================================================
                try {
                    Long targetLong = Long.parseLong(targetFileId);
                    FileItem targetFile = fileItemRepository.findById(targetLong).orElse(null);

                    // BẮT BUỘC KIỂM TRA QUYỀN TRÊN TÀI LIỆU NÀY
                    if (targetFile == null || !fileManagementService.hasFileAccess(targetFile, finalUser, PermissionLevel.VIEWER)) {
                        activityLogManagementService.logActivity(
                                targetFile != null ? targetFile.getCompany() : (finalUser != null ? finalUser.getCompany() : null),
                                finalUser,
                                ActivityType.AI_QUERY_BLOCKED,
                                targetFile,
                                Map.of("reason", "Người dùng không có quyền truy cập tài liệu qua AI", "attemptedQuery", question)
                        );
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền tra cứu nội dung từ tài liệu này qua AI");
                    }
                    allowedDocumentIds = List.of(targetFileId);
                    availableFiles.add(targetFile.getName());
                    if (targetFile.getFolder() != null) {
                        folderName = targetFile.getFolder().getName();
                    }
                } catch (ResponseStatusException rse) {
                    throw rse;
                } catch (NumberFormatException nfe) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã tài liệu không hợp lệ: " + targetFileId);
                }

            } else if (targetFolderId != null && !targetFolderId.isBlank() && !"all".equalsIgnoreCase(targetFolderId)) {
                // =========================================================================
                // TRƯỜNG HỢP 2: Hỏi theo 1 THƯ MỤC cụ thể (Folder - bao gồm các thư mục con)
                // =========================================================================
                try {
                    Long folderLong = Long.parseLong(targetFolderId);
                    Folder targetFolder = folderRepository.findById(folderLong).orElse(null);
                    if (targetFolder != null) {
                        folderName = targetFolder.getName();
                    }

                    Set<Long> targetFolderIds = getFolderAndSubFolderIds(folderLong);

                    // Lấy danh sách thư mục con trực tiếp
                    List<Folder> allFolders = folderRepository.findAll();
                    subFolderNames = allFolders.stream()
                            .filter(f -> f.getParent() != null && f.getParent().getId().equals(folderLong))
                            .map(Folder::getName)
                            .toList();

                    // CHỈ LỌC các file nằm trong thư mục này VÀ user phải có quyền VIEWER
                    List<FileItem> scopedFiles = activeFiles.stream()
                            .filter(f -> f.getFolder() != null && targetFolderIds.contains(f.getFolder().getId()))
                            .toList();

                    allowedDocumentIds = scopedFiles.stream()
                            .map(FileItem::getId)
                            .filter(Objects::nonNull)
                            .map(String::valueOf)
                            .distinct()
                            .toList();

                    availableFiles = scopedFiles.stream()
                            .map(FileItem::getName)
                            .filter(Objects::nonNull)
                            .distinct()
                            .toList();

                    log.info("Chat scoped to folder ID {} ({}): Found {} permitted files for user {}", 
                            folderLong, folderName, allowedDocumentIds.size(), finalUser != null ? finalUser.getEmail() : "anonymous");
                } catch (NumberFormatException nfe) {
                    log.warn("Invalid folderId format: {}", targetFolderId);
                    allowedDocumentIds = List.of();
                }

            } else {
                // =========================================================================
                // TRƯỜNG HỢP 3: Hỏi trên TOÀN BỘ DRIVE
                // =========================================================================
                folderName = "Toàn bộ Drive";
                allowedDocumentIds = activeFiles.stream()
                        .map(FileItem::getId)
                        .filter(Objects::nonNull)
                        .map(String::valueOf)
                        .distinct()
                        .toList();

                availableFiles = activeFiles.stream()
                        .map(FileItem::getName)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();
            }
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            log.warn("Error resolving active files for chat: {}", e.getMessage());
        }

        // Lưu nguồn chính xác (Tên thư mục, tên tệp hoặc Toàn bộ Drive) vào chatSession
        String sessionSource = (folderName != null && !folderName.isBlank())
                ? folderName
                : (!availableFiles.isEmpty() ? availableFiles.get(0) : "Toàn bộ Drive");
        chatSession.setDocumentName(sessionSource);
        chatSession = chatSessionRepository.save(chatSession);

        String mode = (chatRequest.mode() != null && chatRequest.mode().toUpperCase().contains("STANDARD"))
                ? "STANDARD_RAG"
                : "AGENTIC_WORKFLOW";
        String modelProvider = chatRequest.modelProvider() != null ? chatRequest.modelProvider() : "gemini";

        long startTime = System.currentTimeMillis();
        RagResponse ragResponse = null;
        try {
            ragResponse = aiService.ask(
                    RagRequest.builder()
                            .documentId(null) // Luôn dùng allowedDocumentIds để đảm bảo Qdrant chạy qua bộ lọc RBAC đã thẩm duyệt
                            .question(question)
                            .history(history)
                            .mode(mode)
                            .modelProvider(modelProvider)
                            .allowedDocumentIds(allowedDocumentIds)
                            .folderName(folderName)
                            .subFolderNames(subFolderNames)
                            .availableFiles(availableFiles)
                            .build()
            );
        } catch (Exception e) {
            log.error("AI service ask failed: {}", e.getMessage(), e);
        }
        int latencyMs = (int) Math.max(1, System.currentTimeMillis() - startTime);

        String answerText = ragResponse != null && ragResponse.answer() != null
                ? ragResponse.answer()
                : "Hệ thống AI đã nhận được câu hỏi của bạn: \"" + question + "\". Dữ liệu đang được phân tích.";
        answerText = resolveDocumentLinks(answerText);

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
            // Fallback estimation when real token metadata is unavailable
            promptTokens = Math.max(50, (question != null ? question.length() : 0) * 2 + (answerText.length() / 2));
            completionTokens = Math.max(20, answerText.length() / 3);
            totalTokens = promptTokens + completionTokens;
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

    /**
     * Thu thập danh sách ID của thư mục gốc và toàn bộ các thư mục con phân cấp (đệ quy)
     */
    private Set<Long> getFolderAndSubFolderIds(Long rootFolderId) {
        Set<Long> result = new HashSet<>();
        if (rootFolderId == null) return result;
        result.add(rootFolderId);

        try {
            List<Folder> allFolders = folderRepository.findAll();
            boolean added = true;
            while (added) {
                added = false;
                for (Folder f : allFolders) {
                    if (f.getParent() != null && result.contains(f.getParent().getId()) && !result.contains(f.getId())) {
                        result.add(f.getId());
                        added = true;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error resolving subfolders for folderId {}: {}", rootFolderId, e.getMessage());
        }
        return result;
    }

    public String resolveDocumentLinks(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        try {
            String result = text;

            // 1. Tự động nhận diện chính xác theo tên file thực tế trong hệ thống và gán link có fileId để click xem trước
            List<FileItem> activeFiles = fileItemRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
            if (activeFiles != null && !activeFiles.isEmpty()) {
                List<FileItem> sortedFiles = activeFiles.stream()
                        .filter(f -> f.getName() != null && !f.getName().isBlank())
                        .sorted((a, b) -> Integer.compare(b.getName().length(), a.getName().length()))
                        .toList();

                for (FileItem fi : sortedFiles) {
                    String fileName = fi.getName().trim();
                    if (fileName.contains(".") || fileName.length() >= 5) {
                        String escaped = java.util.regex.Pattern.quote(fileName);
                        String filePatternStr = "(?<!\\[)(?:\\*\\*|`|[\"'])?(" + escaped + ")(?:\\*\\*|`|[\"'])?(?!\\s*\\]\\(/files)";
                        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(filePatternStr, java.util.regex.Pattern.CASE_INSENSITIVE);
                        result = pattern.matcher(result).replaceAll(java.util.regex.Matcher.quoteReplacement("[" + fileName + "](/files?fileId=" + fi.getId() + ")"));
                    }
                }
            }

            // Loại bỏ các đoạn chú thích số thứ tự thừa như "(tài liệu số 1 trong danh sách)", "(tài liệu 1)"
            result = result.replaceAll("(?i)\\s*\\((?:tài liệu|tệp|file)\\s*(?:số\\s*)?#?\\d+(?:\\s*trong\\s*danh\\s*sách)?\\)", "");

            return result;
        } catch (Exception e) {
            return text;
        }
    }

}
