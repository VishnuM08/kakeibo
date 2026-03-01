package com.kakeibo.backend.job;

import com.kakeibo.backend.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class PasswordResetCleanupJob {

    private final PasswordResetTokenRepository tokenRepository;

    // Runs every 30 minutes
    @Scheduled(fixedDelay = 30 * 60 * 1000)
    public void cleanupExpiredTokens() {
        int deleted = tokenRepository.deleteExpiredOrUsed(Instant.now());
        if (deleted > 0) {
            log.info("Password reset cleanup: deleted {} tokens", deleted);
        }
    }
}