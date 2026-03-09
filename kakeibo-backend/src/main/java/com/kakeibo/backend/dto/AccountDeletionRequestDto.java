package com.kakeibo.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AccountDeletionRequestDto {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    private String email;
}
