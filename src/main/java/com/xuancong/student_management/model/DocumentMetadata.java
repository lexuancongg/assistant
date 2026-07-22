package com.xuancong.student_management.model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private Document document;

    @Lob
    @Column(name = "metadata_json", nullable = false)
    private String metadataJson;

    @Column(name = "schema_version", nullable = false, length = 20)
    private String schemaVersion;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}