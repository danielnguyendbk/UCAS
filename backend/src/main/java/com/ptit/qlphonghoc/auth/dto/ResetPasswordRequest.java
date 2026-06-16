package com.ptit.qlphonghoc.auth.dto;

public record ResetPasswordRequest(
        String token,
        String newPassword,
        String confirmPassword
) {
}
