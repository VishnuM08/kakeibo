package com.kakeibo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class SavingResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private String goal;
    private double amount;
    private double remainingAmount;
    private LocalDate date;

}
