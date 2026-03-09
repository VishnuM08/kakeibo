package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.EmailOtp;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.EmailOtpRepository;
import com.kakeibo.backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.Duration;

@Service
@AllArgsConstructor
public class EmailOtpService {
    private final EmailOtpRepository emailOtpRepository;
    private final UserRepository userRepository;
    private final OtpUtil otpUtil;
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;

    public void sendOtp(String email) {

        String otp = otpUtil.generateOtp();

        String key = "otp:" + email;

        redisTemplate.opsForValue().set(
                key,
                otp,
                Duration.ofMinutes(5)
        );

        emailService.sendOtpEmail(email, otp);
    }

    public void verifyOtp(String email, String otp) {

        String key = "otp:" + email;

        String storedOtp = redisTemplate.opsForValue().get(key);

        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        redisTemplate.delete(key);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEmailVerified(true);

        userRepository.save(user);
    }
}
