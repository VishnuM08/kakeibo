package com.kakeibo.backend.security;

import com.kakeibo.backend.entity.User;
import com.kakeibo.backend.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = token.getPrincipal();
        String provider = token.getAuthorizedClientRegistrationId(); // "google"

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String provider_id = oAuth2User.getAttribute("sub");
        String picture = oAuth2User.getAttribute("picture");

        // ⚠️ Safety check
        if (email == null) {
            log.error("OAuth login failed: Email is null");
            response.sendRedirect("http://localhost:3000/login?error=email_missing");
            return;
        }

        log.info("OAuth login success for email: {}", email);

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.info("Creating new user for email: {}", email);

            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setPicture(picture);
            user.setProvider(provider.toUpperCase());
            user.setProviderId(provider_id);
            userRepository.save(user);

        } else {
            log.info("Existing user found: {}", email);
            boolean updated = false;

            // ✅ update name if changed
            if (name != null && !name.equals(user.getName())) {
                user.setName(name);
                updated = true;
            }

            if (picture != null && !picture.equals(user.getPicture())) {
                user.setPicture(picture);
                updated = true;
            }

            if (updated) {
                userRepository.save(user);
            }
        }

        // 🔐 JWT generation
        String jwt = jwtService.generate(email);

        log.info("JWT generated for {}", email);

        // 🚀 Redirect with token
        response.sendRedirect("https://kakeibo.theaignite.app/oauth-success?token=" + jwt);
    }
}