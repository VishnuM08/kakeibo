package com.kakeibo.backend.dto;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class UpdateExpenseRequest {



    @NotNull
    private Double amount;

    @NotBlank
    private String description;

    @NotBlank
    private String category;
}
