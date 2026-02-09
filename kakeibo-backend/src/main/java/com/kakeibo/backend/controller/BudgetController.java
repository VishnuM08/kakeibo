package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.SetBudgetRequest;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.security.CustomUserDetails;
import com.kakeibo.backend.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> setBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SetBudgetRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(
                budgetService.setMonthlyBudget(user, request.getMonthlyAmount())
        );
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentBudget(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(
                budgetService.getCurrentBudget(user)
        );
    }
}
