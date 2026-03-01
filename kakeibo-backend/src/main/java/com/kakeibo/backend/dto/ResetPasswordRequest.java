package com.kakeibo.backend.dto;

public record ResetPasswordRequest(
        String token,
        String newPassword
) {}
