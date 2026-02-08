package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.CreateExpenseRequest;
import com.kakeibo.backend.dto.UpdateExpenseRequest;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.security.CustomUserDetails;
import com.kakeibo.backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    private final UserRepository userRepository;

    @PostMapping
    public Object createExpense(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Unauthenticated");
        }

        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return expenseService.createExpense(
                user,
                request.getAmount(),
                request.getDescription(),
                request.getCategory(),
                request.getExpenseDateTime()
        );
    }

    @GetMapping
    public Object getMyExpenses(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return expenseService.getUserExpenses(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeExpense(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        expenseService.deleteExpense(id, user);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public Object updateExpense(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateExpenseRequest request
    ) {
        if (userDetails == null) {
            throw new RuntimeException("Unauthenticated");
        }

        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return expenseService.updateExpense( id,
                user,
                request.getAmount(),
                request.getDescription(),
                request.getCategory()
        );
    }
}
