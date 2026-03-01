package com.kakeibo.backend.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiter {

    private static class Bucket {
        int count;
        Instant resetAt;
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public synchronized boolean allow(String key, int maxRequests, int windowSeconds) {
        Instant now = Instant.now();

        Bucket bucket = buckets.get(key);

        if (bucket == null || now.isAfter(bucket.resetAt)) {
            bucket = new Bucket();
            bucket.count = 1;
            bucket.resetAt = now.plusSeconds(windowSeconds);
            buckets.put(key, bucket);
            return true;
        }

        if (bucket.count >= maxRequests) {
            return false;
        }

        bucket.count++;
        return true;
    }
}