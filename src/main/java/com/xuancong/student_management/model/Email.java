package com.xuancong.student_management.model;

import com.xuancong.student_management.enums.EmailCategory;
import com.xuancong.student_management.enums.EmailPriority;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Email extends BaseAuditEntity{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(length = 255)
    private String sender;

    @Column(length = 255)
    private String receiver;

    @Column(length = 500)
    private String subject;

    @Lob
    @Column(name = "body")
    private String body;

    @Column(name = "has_attachment")
    private Boolean hasAttachment;

    @Column(name = "attachment_count")
    private Integer attachmentCount;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private EmailCategory category = EmailCategory.OTHER;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private EmailPriority priority = EmailPriority.NORMAL;
}