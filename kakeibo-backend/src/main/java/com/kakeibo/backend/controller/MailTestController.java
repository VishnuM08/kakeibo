package com.kakeibo.backend.controller;

import com.kakeibo.backend.service.EmailService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test-mail")
public class MailTestController {

    private final EmailService emailService;

    public MailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping
    public String sendTestMail() {
        emailService.sendPlainText(
                "no-reply@theaignite.app",
                "SES Test – Aignite",
                "This email confirms Amazon SES SMTP is working."
        );
        return "Email sent successfully";
    }
}
