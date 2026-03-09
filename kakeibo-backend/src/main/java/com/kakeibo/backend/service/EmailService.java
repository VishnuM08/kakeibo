package com.kakeibo.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    // Plain text email
    public void sendPlainText(String to, String subject, String body) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("Kakeibo • Aignite <" + fromEmail + ">");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }

    // OTP Email
    public void sendOtpEmail(String to, String otp) {

        String subject = "Your Kakeibo Verification Code";

        // Format OTP (123456 → 123 456)
        String formattedOtp = otp.replaceAll("(.{3})", "$1 ").trim();

        String body = """
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">

<div style="max-width:500px; margin:auto; background:white; padding:30px; border-radius:10px; text-align:center;">

<h2 style="color:#333;">Verify Your Email</h2>

<p style="color:#555; font-size:15px;">
Use the verification code below to complete your sign in.
</p>

<div style="margin:30px 0;">
<span style="
font-size:32px;
font-weight:bold;
letter-spacing:6px;
color:#2c3e50;
background:#f2f2f2;
padding:12px 20px;
border-radius:6px;
display:inline-block;
">
%s
</span>
</div>

<p style="color:#777; font-size:14px;">
This code will expire in <b>5 minutes</b>.
</p>

<p style="color:#999; font-size:13px;">
For security reasons, never share this code with anyone.
</p>

<p style="color:#999; font-size:13px;">
If you did not request this code, you can safely ignore this email.
</p>

<hr style="margin:30px 0;">

<p style="font-size:12px; color:#aaa;">
Kakeibo • Aignite Technologies
</p>

</div>

</body>
</html>
""".formatted(formattedOtp);

        sendHtmlEmail(to, subject, body);
    }

    // Account Deletion OTP Email
    public void sendAccountDeletionOtpEmail(String to, String otp) {

        String subject = "Kakeibo Account Deletion Request";

        String formattedOtp = otp.replaceAll("(.{3})", "$1 ").trim();

        String body = """
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">

<div style="max-width:500px; margin:auto; background:white; padding:30px; border-radius:10px; text-align:center;">

<h2 style="color:#e74c3c;">Account Deletion Request</h2>

<p style="color:#555; font-size:15px;">
We received a request to permanently delete your Kakeibo account.<br>
Use the code below to confirm this action.
</p>

<div style="margin:30px 0;">
<span style="
font-size:32px;
font-weight:bold;
letter-spacing:6px;
color:#2c3e50;
background:#f2f2f2;
padding:12px 20px;
border-radius:6px;
display:inline-block;
">
%s
</span>
</div>

<p style="color:#e74c3c; font-size:14px; font-weight:bold;">
⚠️ This will permanently delete your account and all associated data.
</p>

<p style="color:#777; font-size:14px;">
This code will expire in <b>10 minutes</b>.
</p>

<p style="color:#999; font-size:13px;">
If you did not request account deletion, please secure your account immediately.
</p>

<hr style="margin:30px 0;">

<p style="font-size:12px; color:#aaa;">
Kakeibo • Aignite Technologies
</p>

</div>

</body>
</html>
""".formatted(formattedOtp);

        sendHtmlEmail(to, subject, body);
    }

    // HTML Email Sender
    @Async
    public void sendHtmlEmail(String to, String subject, String body) {

        try {

            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("Kakeibo • Aignite <" + fromEmail + ">");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);

        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
            throw new RuntimeException("Failed to send email");
        }
    }
}