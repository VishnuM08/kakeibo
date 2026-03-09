package com.kakeibo.backend.repository;

import com.kakeibo.backend.entity.AccountDeletionOtp;
import com.kakeibo.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AccountDeletionOtpRepository extends JpaRepository<AccountDeletionOtp, UUID> {

    Optional<AccountDeletionOtp> findTopByUserAndVerifiedFalseOrderByCreatedAtDesc(User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM AccountDeletionOtp o WHERE o.user = :user")
    void deleteAllByUser(User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM AccountDeletionOtp o WHERE o.expiresAt < :now")
    void deleteAllExpired(Instant now);
}
