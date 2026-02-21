package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.LoginRequest;
import com.kakeibo.backend.dto.LoginResponse;
import com.kakeibo.backend.dto.RegisterRequest;
import com.kakeibo.backend.dto.UserProfileResponse;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.security.CustomUserDetails;
import com.kakeibo.backend.security.JwtUtil;
import com.kakeibo.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final UserRepository userRepository;


    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getEmail(), req.getPassword())
        );
        return new LoginResponse(jwtUtil.generate(req.getEmail()));
    }

    @PostMapping("/register")
    public UserProfileResponse registerUser(@RequestBody RegisterRequest request) {
        User user = userService.createUser(
                request.getName(),
                request.getEmail(),
                request.getPassword()
        );

        return new UserProfileResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getName()
        );
    }

//    @PostMapping("/auth/register")
//    public User registerUser(
//            @Valid @RequestBody RegisterRequest request) {
//        return userService.createUser(
//                request.getName(),
//                request.getEmail(),
//                request.getPassword()
//        );
//
//    }

    //
//    @GetMapping("/me")
//    public UserProfileResponse me(
//            @AuthenticationPrincipal UserDetails userDetails
//    ) {
//        User user = userRepository
//                .findByEmail(userDetails.getUsername())
//                .orElseThrow();
//
//        return new UserProfileResponse(
//                user.getId().toString(),
//                user.getEmail(),
//                user.getName()
//        );
//    }
//    @GetMapping("/me")
//    public UserProfileResponse me(Authentication authentication) {
//
//        if (authentication == null || !authentication.isAuthenticated()) {
//            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
//        }
//
//        String email = authentication.getName(); // comes from JWT subject
//
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() ->
//                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
//                );
//
//        return new UserProfileResponse(
//                user.getId().toString(),
//                user.getEmail(),
//                user.getName()
//        );
//    }


}
