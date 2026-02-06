package com.kakeibo.backend.dto;// package: com.kakeibo.backend.dto

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String email;
    private String name;
}
