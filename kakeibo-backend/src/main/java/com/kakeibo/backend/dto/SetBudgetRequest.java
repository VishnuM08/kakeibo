package com.kakeibo.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

@Getter
public class SetBudgetRequest {

    @NotNull
    @Positive
    private Double monthlyAmount;
}
