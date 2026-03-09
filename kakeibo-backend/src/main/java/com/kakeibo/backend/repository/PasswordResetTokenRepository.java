package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    @Modifying
    @Transactional
    @Query("""
                delete from PasswordResetToken t
                where t.expiresAt < :now or t.used = true
            """)
    int deleteExpiredOrUsed(Instant now);

    Optional<PasswordResetToken> findByTokenHashAndUsedFalse(String tokenHash);

    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.user = :user")
    void deleteByUser(com.kakeibo.backend.entity.User user);

}