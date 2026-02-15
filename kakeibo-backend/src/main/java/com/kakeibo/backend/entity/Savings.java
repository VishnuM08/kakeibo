package com.kakeibo.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
        name = "savings",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "goal_name", "date"})
        }
)
@Getter
@Setter
public class Savings {

        @Id
        @GeneratedValue
        private UUID id;

        @Column(nullable = false)
        private String goalName;

        // 🎯 Target amount
        @Column(nullable = false)
        private Double amount;

        // 💰 Remaining to complete goal
        @Column(nullable = false)
        private Double remainingAmount;

        @Column(nullable = false)
        private LocalDate date;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(nullable = false, updatable = false)
        private Instant createdAt;

        @Column(nullable = false)
        private Instant updatedAt;

        @PrePersist
        void onCreate() {
                Instant now = Instant.now();
                this.createdAt = now;
                this.updatedAt = now;
        }

        @PreUpdate
        void onUpdate() {
                this.updatedAt = Instant.now();
        }
}
