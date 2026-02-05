package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.CreateExpenseRequest;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.security.CustomUserDetails;
import com.kakeibo.backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

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
                request.getExpenseDate()
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
    
}
