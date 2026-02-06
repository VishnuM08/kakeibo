package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.LoginRequest;
import com.kakeibo.backend.dto.LoginResponse;
import com.kakeibo.backend.dto.UserProfileResponse;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;


    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getEmail(), req.getPassword())
        );
        return new LoginResponse(jwtUtil.generate(req.getEmail()));
    }



    @GetMapping("/me")
    public UserProfileResponse me(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        return new UserProfileResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getName()
        );
    }}
