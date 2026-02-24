package com.kakeibo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BudgetResponse {
    private Double monthlyAmount;
    private Double remainingAmount;
}
