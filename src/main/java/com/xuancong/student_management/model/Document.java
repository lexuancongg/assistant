package com.xuancong.student_management.model;


import com.xuancong.student_management.enums.DocumentStatus;
import com.xuancong.student_management.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document extends BaseAuditEntity {

    // =========================
    // Identity
    // =========================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // =========================
    // File Information
    // =========================

    @Column(name = "document_name", nullable =false, length = 255)
    private String documentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 100)
    private DocumentType documentType;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(length = 64, unique = true)
    private String fileHash;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(length = 10)
    private String language;

    // =========================
    // Processing
    // =========================

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DocumentStatus status;

    @Column(name = "needs_review")
    private Boolean needsReview;

    @Column(name = "classification_confidence")
    private Double classificationConfidence;

    // =========================
    // AI Result
    // =========================

    @Lob
    @Column(name = "summary")
    private String summary;

    @Lob
    @Column(name = "ocr_text")
    private String ocrText;

    // =========================
    // Upload Information
    // =========================

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;
}