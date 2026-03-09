package com.kakeibo.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.kakeibo.backend.entity.RecurringExpense;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class RecurringExpenseResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private Double amount;
    private String category;
    private String description;
    private RecurringExpense.Frequency frequency;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate lastGenerated;
    @JsonProperty("isActive")
    private boolean isActive;
}
