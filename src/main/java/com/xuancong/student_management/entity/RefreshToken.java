package com.xuancong.student_management.entity;

import com.xuancong.student_management.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Lưu refresh token — FK sang entity/User (UUID).
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean revoked = false;
}
