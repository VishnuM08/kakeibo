package com.kakeibo.backend.dto;

import com.kakeibo.backend.entity.RecurringExpense;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecurringExpenseRequest {

    @NotBlank
    private String description;

    @NotBlank
    private String category;

    @NotNull
    private Double amount;

    @NotNull
    private RecurringExpense.Frequency frequency;

    @NotNull
    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean isActive;
}
