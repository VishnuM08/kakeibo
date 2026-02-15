package com.kakeibo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class SavingResponse {

    private String goal;
    private double amount;
    private double remainingAmount;
    private LocalDate date;

}
