package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.PasswordResetToken;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.PasswordResetTokenRepository;
import com.kakeibo.backend.repository.UserRepository;
//import com.kakeibo.backend.service.ResetTokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService; // ✅ REQUIRED

    // ✅ 1️⃣ FORGOT PASSWORD (SEND EMAIL)
    public void initiatePasswordReset(String email) {

        userRepository.findByEmail(email).ifPresent(user -> {

            // Generate raw token
            String rawToken = ResetTokenUtil.generateToken();

            // Hash token for DB
            String tokenHash = ResetTokenUtil.hashToken(rawToken);

            // Save token
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(tokenHash);
            token.setExpiresAt(Instant.now().plusSeconds(15 * 60)); // 15 min

            tokenRepository.save(token);

            // Build reset link
            String resetLink =
                    "https://localhost:3000/reset-password?token=" + rawToken;

            // Send email
            emailService.sendPlainText(
                    user.getEmail(),
                    "Reset your password",
                    "Click the link below to reset your password:\n\n" + resetLink
            );
        });

        // IMPORTANT:
        // If email does NOT exist → do nothing (prevents user enumeration)
    }

    // ✅ 2️⃣ RESET PASSWORD (USING TOKEN)
    public void resetPassword(String rawToken, String newPassword) {

        String tokenHash = ResetTokenUtil.hashToken(rawToken);

        PasswordResetToken token = tokenRepository
                .findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new RuntimeException("Token expired");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));

        token.setUsed(true);

        userRepository.save(user);
        tokenRepository.save(token);
    }
}