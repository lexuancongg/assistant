package com.xuancong.student_management.service;

import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DownloadTokenService {

    @Getter
    @Builder
    public static class DownloadTicket {
        private String token;
        private Long fileId;
        private String fileName;
        private String storagePath;
        private String fileType;
        private String directUrl;
        private Instant expiresAt;
    }

    private final Map<String, DownloadTicket> tokenStore = new ConcurrentHashMap<>();

    public String createToken(Long fileId, String fileName, String storagePath, String fileType, String directUrl) {
        Instant now = Instant.now();
        // Clean up expired tokens
        tokenStore.entrySet().removeIf(entry -> entry.getValue().getExpiresAt().isBefore(now));

        String token = UUID.randomUUID().toString().replace("-", "");
        DownloadTicket ticket = DownloadTicket.builder()
                .token(token)
                .fileId(fileId)
                .fileName(fileName)
                .storagePath(storagePath)
                .fileType(fileType)
                .directUrl(directUrl)
                .expiresAt(now.plusSeconds(120)) // 2 minutes validity
                .build();
        tokenStore.put(token, ticket);
        return token;
    }

    public DownloadTicket validateToken(String token) {
        if (token == null || token.isBlank()) return null;
        DownloadTicket ticket = tokenStore.get(token);
        if (ticket == null) return null;
        if (ticket.getExpiresAt().isBefore(Instant.now())) {
            tokenStore.remove(token);
            return null;
        }
        return ticket;
    }

    public DownloadTicket validateAndConsumeToken(String token) {
        if (token == null || token.isBlank()) return null;
        DownloadTicket ticket = tokenStore.remove(token);
        if (ticket == null) return null;
        if (ticket.getExpiresAt().isBefore(Instant.now())) {
            return null;
        }
        return ticket;
    }
}
