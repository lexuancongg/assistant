package com.xuancong.student_management.service;

import com.xuancong.student_management.dto.file.DocumentChunkDto;
import com.xuancong.student_management.entity.DocumentChunk;
import com.xuancong.student_management.repository.DocumentChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentChunkService {

    private final DocumentChunkRepository chunkRepository;

    public List<DocumentChunkDto> getChunksByFileId(Long fileId) {
        List<DocumentChunk> chunks = chunkRepository.findByFile_IdOrderByChunkIndexAsc(fileId);
        return chunks.stream()
                .map(c -> new DocumentChunkDto(
                        c.getId(),
                        c.getFile().getId(),
                        c.getFile().getName(),
                        c.getChunkIndex(),
                        c.getPointId(),
                        c.getContent(),
                        c.getTokenCount(),
                        c.getPageNumber(),
                        c.isActive(),
                        c.getCreatedAt()
                ))
                .toList();
    }
}
