package com.xuancong.student_management.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
    name = "file_extractions",
    indexes = {
        @Index(name = "idx_file_extractions_file_id", columnList = "file_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class FileExtraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileItem file;

    @Column(name = "document_type", length = 50)
    private String documentType; // CONTRACT, INVOICE, EMAIL, OTHER, etc.

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "extracted_by")
    private User extractedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
