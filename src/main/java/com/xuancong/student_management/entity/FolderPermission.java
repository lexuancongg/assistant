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
 * Quyền cấp ở cấp thư mục. Khi upload file vào thư mục mà không set quyền riêng,
 * backend copy các dòng này sang FilePermission của file mới (kế thừa mặc định),
 * nhưng vẫn cho phép override riêng từng file sau đó.
 */
@Entity
@Table(
    name = "folder_permissions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"folder_id", "subject_type", "subject_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class FolderPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "folder_id", nullable = false)
    private Folder folder;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 20)
    private PermissionSubjectType subjectType;

    // department_id | role (lưu dạng uuid ánh xạ) | user_id tùy theo subjectType
    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PermissionLevel level = PermissionLevel.VIEWER;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
