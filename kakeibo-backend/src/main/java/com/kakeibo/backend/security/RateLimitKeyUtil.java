package com.kakeibo.backend.security;

import jakarta.servlet.http.HttpServletRequest;

public class RateLimitKeyUtil {

    public static String ipKey(HttpServletRequest request, String endpoint) {
        return endpoint + ":" + request.getRemoteAddr();
    }
}