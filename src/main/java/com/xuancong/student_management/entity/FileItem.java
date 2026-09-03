package com.xuancong.student_management.entity;

import com.xuancong.student_management.entity.enums.FileVisibility;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "files")
@Getter
@Setter
@NoArgsConstructor
public class FileItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType; // pdf, docx, xlsx, pptx, txt, image...

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    // Chủ sở hữu theo phòng ban — độc lập với folder.defaultDepartment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_department_id")
    private Department ownerDepartment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FileVisibility visibility = FileVisibility.RESTRICTED;

    @Column(name = "current_version_id")
    private UUID currentVersionId;

    @Column(name = "is_ai_indexed", nullable = false)
    private boolean aiIndexed = false;

    // Soft delete — dùng cho thùng rác, khác null nghĩa là đã xóa
    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FileVersion> versions = new ArrayList<>();

    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FilePermission> permissions = new ArrayList<>();

    @OneToMany(mappedBy = "file", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FileTag> tags = new ArrayList<>();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
