package com.kakeibo.backend.controller;

import com.kakeibo.backend.dto.RegisterRequest;
import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import com.kakeibo.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TestUserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/test/user")
    public User createUser() {
        User user = new User();
        user.setName("Vishnu");
        user.setEmail("vishnu@test.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        return userRepository.save(user);
    }

    @PostMapping("/auth/register")
    public User registerUser(
            @Valid @RequestBody RegisterRequest request) {
        return userService.createUser(
                request.getName(),
                request.getEmail(),
                request.getPassword()
        );

    }

}
