package com.kakeibo.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SetSavingsRequest {

    @NotNull
    private String goal;

    @NotNull
    @Positive
    private Double amount;

    @NotNull
    private LocalDate date;
}
