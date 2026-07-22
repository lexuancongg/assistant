package com.xuancong.student_management.repository;

import com.xuancong.student_management.model.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk,Long> {
    Optional<DocumentChunk> findByDocumentIdAndChunkIndex(Long documentId, Integer chunkIndex);
    Optional<DocumentChunk> findByEmbeddingId(String embeddingId);
}
