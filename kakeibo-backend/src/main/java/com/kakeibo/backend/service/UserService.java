package com.kakeibo.backend.service;

import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(String name, String email, String rawPassword) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);

        // 🔥 THIS LINE MUST EXIST
        user.setPasswordHash(passwordEncoder.encode(rawPassword));

        return userRepository.save(user);
    }
}
