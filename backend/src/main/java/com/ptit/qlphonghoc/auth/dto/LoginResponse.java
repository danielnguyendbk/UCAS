package com.ptit.qlphonghoc.auth.dto;

import java.util.List;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserSummaryResponse user,
        Object profile,
        List<String> permissions,
        String redirectPath
) {
}
