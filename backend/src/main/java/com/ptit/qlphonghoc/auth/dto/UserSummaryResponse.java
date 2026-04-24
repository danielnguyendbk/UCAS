package com.ptit.qlphonghoc.auth.dto;

import com.ptit.qlphonghoc.user.enumtype.UserRole;

public record UserSummaryResponse(
        Integer id,
        String username,
        String email,
        String fullName,
        UserRole role,
        boolean isActive
) {
}
