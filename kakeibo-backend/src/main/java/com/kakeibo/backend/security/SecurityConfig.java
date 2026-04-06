package com.kakeibo.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;

import java.io.IOException;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final RateLimitFilter rateLimitFilter;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
//                .cors()
//                .and()
//                .csrf(csrf -> csrf.disable())

                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm ->
                        //sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                        sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ PUBLIC
                        .requestMatchers(
                                "/auth/login",
                                "/auth/register",
                                "/auth/forgot-password",
                                "/auth/reset-password",
                                "/auth/verify-otp",

                                // Account deletion (public - user may not have valid JWT)
                                "/account/delete/request",
                                "/account/delete/confirm",

                                // ✅ Actuator (ALL, not just health)
                                "/actuator/**",

                                // ✅ Error endpoint (CRITICAL)
                                "/error",

                                "/auth/*"
                        ).permitAll()


                        // 🔐 PROTECTED
                        .requestMatchers(
                                "/auth/me",
                                "/expenses/**",
                                "/recurring-expenses/**",
                                "/budget/**",
                                "/savings/**"
                        ).authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                rateLimitFilter,
                UsernamePasswordAuthenticationFilter.class)

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oAuth2 -> oAuth2.failureHandler(
                        (AuthenticationFailureHandler) (request, response, exception) -> {
                            log.error("OAuth2LoginFailureHandler", exception.getMessage());
                        }
                ).successHandler(oAuth2SuccessHandler));





        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "https://kakeibo.theaignite.app",
                "capacitor://localhost",
                "http://localhost",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:4173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
