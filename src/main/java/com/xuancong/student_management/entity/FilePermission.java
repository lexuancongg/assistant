package com.xuancong.student_management.entity;

import com.xuancong.student_management.entity.enums.PermissionLevel;
import com.xuancong.student_management.entity.enums.PermissionSubjectType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

/**
 * Bảng lõi của cơ chế permission-aware RAG.
 * Mỗi dòng = 1 quyền cấp cho 1 "đối tượng" (phòng ban / vai trò / user cụ thể) trên 1 file.
 * Đây chính là nguồn sự thật (source of truth) — Qdrant chỉ giữ bản sao (denormalized)
 * dưới dạng payload để filter nhanh khi retrieval.
 */
@Entity
@Table(
    name = "file_permissions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"file_id", "subject_type", "subject_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class FilePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileItem file;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 20)
    private PermissionSubjectType subjectType;

    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PermissionLevel level = PermissionLevel.VIEWER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by")
    private User grantedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
