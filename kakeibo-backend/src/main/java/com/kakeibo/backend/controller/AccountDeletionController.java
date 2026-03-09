package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.AccountDeletionConfirmDto;
import com.kakeibo.backend.dto.AccountDeletionRequestDto;
import com.kakeibo.backend.dto.ApiResponse;
import com.kakeibo.backend.service.AccountDeletionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountDeletionController {

    private final AccountDeletionService accountDeletionService;

    /**
     * POST /api/account/delete/request
     * Sends a 6-digit OTP to the user's email to initiate account deletion.
     */
    @PostMapping("/delete/request")
    public ResponseEntity<ApiResponse> requestDeletion(
            @Valid @RequestBody AccountDeletionRequestDto request) {

        accountDeletionService.requestDeletion(request.getEmail());

        return ResponseEntity.ok(
                new ApiResponse(true, "Deletion code sent to your registered email. It expires in 10 minutes.")
        );
    }

    /**
     * POST /api/account/delete/confirm
     * Verifies OTP and permanently deletes the account and all data.
     */
    @PostMapping("/delete/confirm")
    public ResponseEntity<ApiResponse> confirmDeletion(
            @Valid @RequestBody AccountDeletionConfirmDto request) {

        accountDeletionService.confirmDeletion(request.getEmail(), request.getOtp());

        return ResponseEntity.ok(
                new ApiResponse(true, "Your account and all associated data have been permanently deleted.")
        );
    }
}
