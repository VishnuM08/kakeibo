package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.CreateExpenseRequest;
import com.kakeibo.backend.dto.ExpenseResponse;
import com.kakeibo.backend.dto.UpdateExpenseRequest;
import com.kakeibo.backend.security.CustomUserDetails;
import com.kakeibo.backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    // ===============================
    // CREATE
    // ===============================
    @PostMapping
    public ExpenseResponse createExpense(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Valid CreateExpenseRequest request
    ) {
        return expenseService.createExpense(request, userDetails);
    }

    // ===============================
    // READ
    // ===============================
    @GetMapping
    public List<ExpenseResponse> getUserExpenses(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return expenseService.getUserExpenses(userDetails);
    }

    // ===============================
    // UPDATE
    // ===============================
    @PutMapping("/{id}")
    public ExpenseResponse updateExpense(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateExpenseRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return expenseService.updateExpense(id, request, userDetails);
    }

    // ===============================
    // DELETE
    // ===============================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        expenseService.deleteExpense(id, userDetails);
        return ResponseEntity.noContent().build();
    }
}
