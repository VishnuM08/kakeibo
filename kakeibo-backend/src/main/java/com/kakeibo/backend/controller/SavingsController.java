package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.SetSavingsRequest;
import com.kakeibo.backend.dto.UpdateSavingsRequest;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.security.CustomUserDetails;
import com.kakeibo.backend.service.SavingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/savings")
@RequiredArgsConstructor
public class SavingsController {

    private final SavingsService savingsService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createSavings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SetSavingsRequest request
    ) {
        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(
                savingsService.setSavings(
                        user,
                        request.getGoal(),
                        request.getAmount(),
                        request.getDate()
                )
        );
    }

    @GetMapping
    public ResponseEntity<?> getSavings(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(
                savingsService.getAllSavings(user)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> addSavings(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSavingsRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return ResponseEntity.ok(
                savingsService.addToSavings(
                        id,
                        user,
                        request.getAddAmount()
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSavings(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        savingsService.deleteSavings(id, user);
        return ResponseEntity.noContent().build();
    }
}
