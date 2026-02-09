package com.kakeibo.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class    CreateExpenseRequest {

    @NotNull
    private Double amount;

    @NotBlank
    private String description;

    @NotBlank
    private String category;

    @NotNull
    private Instant expenseDateTime;
}
