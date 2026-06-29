package com.ptit.qlphonghoc.auth.dto;

public record UpdateProfileRequest(
        String fullName,
        String full_name,
        String email
) {
}
