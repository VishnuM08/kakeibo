package com.kakeibo.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import com.kakeibo.backend.entity.User; // 👈 REQUIRED
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "password_reset_tokens")

@Getter
@Setter
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private User user;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // getters & setters
}