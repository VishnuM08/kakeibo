package com.kakeibo.backend.dto;

import com.kakeibo.backend.entity.RecurringExpense;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRecurringExpenseRequest {

    private String description;

    private String category;

    private Double amount;

    private RecurringExpense.Frequency frequency;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean isActive;
}
