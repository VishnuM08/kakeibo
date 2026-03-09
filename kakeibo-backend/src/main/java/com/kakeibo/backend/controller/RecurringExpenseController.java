package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.CreateRecurringExpenseRequest;
import com.kakeibo.backend.dto.RecurringExpenseResponse;
import com.kakeibo.backend.dto.UpdateRecurringExpenseRequest;
import com.kakeibo.backend.security.CustomUserDetails;
import com.kakeibo.backend.service.RecurringExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/recurring-expenses")
@RequiredArgsConstructor
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    @PostMapping
    public RecurringExpenseResponse createRecurringExpense(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Valid CreateRecurringExpenseRequest request
    ) {
        return recurringExpenseService.createRecurringExpense(request, userDetails);
    }

    @GetMapping
    public List<RecurringExpenseResponse> getRecurringExpenses(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return recurringExpenseService.getRecurringExpenses(userDetails);
    }

    @PutMapping("/{id}")
    public RecurringExpenseResponse updateRecurringExpense(
            @PathVariable UUID id,
            @RequestBody UpdateRecurringExpenseRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return recurringExpenseService.updateRecurringExpense(id, request, userDetails);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringExpense(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        recurringExpenseService.deleteRecurringExpense(id, userDetails);
        return ResponseEntity.noContent().build();
    }
}
