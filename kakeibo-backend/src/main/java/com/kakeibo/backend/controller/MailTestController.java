package com.kakeibo.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EmailController {

    @GetMapping("/mail-test")
    public String testMail() {
        emailService.sendPlainText(
                "yourgmail@gmail.com",
                "SES DEV TEST",
                "Mail config is working"
        );
        return "Sent";
    }
}
