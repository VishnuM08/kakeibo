package com.kakeibo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;

@Getter
@AllArgsConstructor
public class BudgetResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Double monthlyAmount;
    private Double remainingAmount;
}
