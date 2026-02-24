package com.kakeibo.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSavingsRequest {

    @NotNull
    @Positive
    private double addAmount;
}
