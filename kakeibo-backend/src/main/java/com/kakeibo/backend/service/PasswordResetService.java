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

            // Email subject
            String subject = "Reset Your Kakeibo Password";

            // Email body
            String body = """
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">

<div style="max-width:500px; margin:auto; background:white; padding:30px; border-radius:10px; text-align:center;">

<h2 style="color:#333;">Reset Your Password</h2>

<p style="color:#555; font-size:15px;">
We received a request to reset your password.
</p>

<p style="color:#555; font-size:15px;">
Click the button below to create a new password.
</p>

<div style="margin:30px 0;">
<a href="%s"
style="background:#2c3e50; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-size:16px;">
Reset Password
</a>
</div>

<p style="color:#777; font-size:14px;">
This link will expire in <b>15 minutes</b>.
</p>

<p style="color:#999; font-size:13px;">
If you did not request a password reset, you can safely ignore this email.
</p>

<hr style="margin:30px 0;">

<p style="font-size:12px; color:#aaa;">
Kakeibo • Aignite Technologies
</p>

</div>

</body>
</html>
""".formatted(resetLink);

            // Send email
            emailService.sendHtmlEmail(user.getEmail(), subject, body);
        });

        // If email does not exist → do nothing (prevents user enumeration)
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