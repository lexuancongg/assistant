package com.xuancong.student_management.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "user_starred_files", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_file_starred", columnNames = {"user_id", "file_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class UserStarredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "file_id", nullable = false)
    private FileItem file;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UserStarredFile(User user, FileItem file) {
        this.user = user;
        this.file = file;
        this.createdAt = Instant.now();
    }
}
