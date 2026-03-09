package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.AccountDeletionOtp;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.exception.InvalidOtpException;
import com.kakeibo.backend.exception.OtpExpiredException;
import com.kakeibo.backend.exception.TooManyAttemptsException;
import com.kakeibo.backend.exception.UserNotFoundException;
import com.kakeibo.backend.repository.*;
import com.kakeibo.backend.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RATE_LIMIT_MINUTES = 2;

    private final UserRepository userRepository;
    private final AccountDeletionOtpRepository deletionOtpRepository;
    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final SavingsRepository savingsRepository;
    private final RecurringExpenseRepository recurringExpenseRepository;
    private final EmailOtpRepository emailOtpRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final OtpUtil otpUtil;
    private final EmailService emailService;

    /**
     * Sends a deletion OTP to the user's email.
     * Rate-limited: user must wait RATE_LIMIT_MINUTES between requests.
     */
    public void requestDeletion(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("No account found with this email address."));

        // Rate limit: check if a recent unexpired OTP was issued within RATE_LIMIT_MINUTES
        deletionOtpRepository.findTopByUserAndVerifiedFalseOrderByCreatedAtDesc(user)
                .ifPresent(existing -> {
                    Instant rateLimitCutoff = Instant.now().minusSeconds(RATE_LIMIT_MINUTES * 60L);
                    if (existing.getCreatedAt().isAfter(rateLimitCutoff)) {
                        throw new TooManyAttemptsException(
                                "Please wait " + RATE_LIMIT_MINUTES + " minutes before requesting a new deletion code."
                        );
                    }
                });

        String otp = otpUtil.generateOtp();
        Instant expiresAt = Instant.now().plusSeconds(OTP_EXPIRY_MINUTES * 60L);

        AccountDeletionOtp otpEntity = AccountDeletionOtp.builder()
                .user(user)
                .otpCode(otp)
                .expiresAt(expiresAt)
                .verified(false)
                .attemptCount(0)
                .build();

        deletionOtpRepository.save(otpEntity);

        emailService.sendAccountDeletionOtpEmail(email, otp);

        log.info("Account deletion OTP sent to user: {}", email);
    }

    /**
     * Verifies OTP and permanently deletes the user account and all related data.
     */
    @Transactional
    public void confirmDeletion(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("No account found with this email address."));

        AccountDeletionOtp otpEntity = deletionOtpRepository
                .findTopByUserAndVerifiedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new InvalidOtpException("No pending deletion request found. Please request a new code."));

        // Check attempt count
        if (otpEntity.getAttemptCount() >= MAX_ATTEMPTS) {
            deletionOtpRepository.delete(otpEntity);
            throw new TooManyAttemptsException("Too many failed attempts. Please request a new deletion code.");
        }

        // Check expiry
        if (Instant.now().isAfter(otpEntity.getExpiresAt())) {
            deletionOtpRepository.delete(otpEntity);
            throw new OtpExpiredException("Deletion code has expired. Please request a new one.");
        }

        // Validate OTP
        if (!otpEntity.getOtpCode().equals(otp)) {
            otpEntity.setAttemptCount(otpEntity.getAttemptCount() + 1);
            deletionOtpRepository.save(otpEntity);
            int remaining = MAX_ATTEMPTS - otpEntity.getAttemptCount();
            throw new InvalidOtpException("Invalid code. " + remaining + " attempt(s) remaining.");
        }

        // Mark as verified
        otpEntity.setVerified(true);
        deletionOtpRepository.save(otpEntity);

        log.warn("Account deletion confirmed for user: {} (id: {})", email, user.getId());

        // Delete all user data transactionally
        deleteAllUserData(user);
    }

    private void deleteAllUserData(User user) {
        UUID userId = user.getId();
        String email = user.getEmail();

        // Bulk JPQL deletes in dependency order
        recurringExpenseRepository.deleteByUser(user);
        expenseRepository.deleteByUser(user);
        budgetRepository.deleteByUser(user);
        savingsRepository.deleteByUser(user);
        passwordResetTokenRepository.deleteByUser(user);
        emailOtpRepository.deleteByEmail(email);
        deletionOtpRepository.deleteAllByUser(user);

        // Delete user via JPQL to avoid stale entity issues after bulk deletes
        userRepository.deleteByIdJpql(userId);

        log.warn("All data deleted for user: {}", email);
    }
}
