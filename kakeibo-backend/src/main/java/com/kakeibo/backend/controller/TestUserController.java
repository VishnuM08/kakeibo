package com.kakeibo.backend.controller;

import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TestUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/test/user")
    public User createUser() {
        User user = new User();
        user.setName("Vishnu");
        user.setEmail("vishnu@test.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        return userRepository.save(user);
    }
}
