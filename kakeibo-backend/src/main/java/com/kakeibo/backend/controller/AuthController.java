package com.kakeibo.backend.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.kakeibo.backend.dto.*;
import com.kakeibo.backend.entity.EmailOtp;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.EmailOtpRepository;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.security.JwtUtil;
import com.kakeibo.backend.service.EmailOtpService;
import com.kakeibo.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final UserRepository userRepository;
    private final EmailOtpService emailOtpService;
    private final EmailOtpRepository emailOtpRepository;


    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getEmail(), req.getPassword())
        );
        User user = userRepository.findByEmail(req.getEmail()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not verified");
        }
        return new LoginResponse(jwtUtil.generate(req.getEmail()));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());

        if (existingUser.isPresent()) {
            if (existingUser.get().isEmailVerified()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use.");
            } else {
                Optional<EmailOtp> recentOtp = emailOtpRepository.findTopByEmailOrderByCreatedAtDesc(request.getEmail());
                if (recentOtp.isPresent() && recentOtp.get().getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(1))) {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Please wait a minute before requesting a new OTP.");
                }
            }
        } else {
            userService.createUser(
                    request.getName(),
                    request.getEmail(),
                    request.getPassword()
            );
        }

        emailOtpService.sendOtp(request.getEmail());

        return ResponseEntity.ok(Map.of("message", "Verification code sent. Please check your email."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@RequestBody VerifyOtpRequest request) {
        emailOtpService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(Map.of("message", "Email verified successfully."));
    }

    @GetMapping("/me")
    public UserProfileResponse me(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        String email = authentication.getName(); // JWT subject

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found")
                );

        return new UserProfileResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getName(),
                user.getPicture()
        );
    }

    @PostMapping("/google")
    public LoginResponse googleLogin(@RequestBody GoogleAuthRequest request) {
        final String WEB_CLIENT_ID = "460861594388-abvmsc7bsrdqf67hsbk90m4mo36qsgao.apps.googleusercontent.com";

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
            .setAudience(Collections.singletonList(WEB_CLIENT_ID))
            .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
            }

            Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            // Find existing user or auto-register them (Google users are pre-verified)
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName(name != null ? name : email);
                newUser.setPicture(picture);
                newUser.setProvider("GOOGLE");
                newUser.setProviderId(payload.getSubject());
                newUser.setEmailVerified(true); // Google already verified this email
                // No password needed for OAuth users
                return userRepository.save(newUser);
            });

            // Update picture if it changed
            if (picture != null && !picture.equals(user.getPicture())) {
                user.setPicture(picture);
                userRepository.save(user);
            }

            String jwt = jwtUtil.generate(email);
            return new LoginResponse(jwt);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Google authentication failed: " + e.getMessage());
        }
    }
}
