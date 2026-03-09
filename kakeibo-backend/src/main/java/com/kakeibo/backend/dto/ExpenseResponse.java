package com.kakeibo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ExpenseResponse implements Serializable {

    private UUID id;
    private Double amount;
    private String description;
    private String category;
    private Instant expenseDateTime;

    private String source;
    private boolean duplicate;
}