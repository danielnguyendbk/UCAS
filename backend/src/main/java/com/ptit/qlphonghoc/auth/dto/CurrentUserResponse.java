package com.ptit.qlphonghoc.auth.dto;

import java.util.List;

public record CurrentUserResponse(
        UserSummaryResponse user,
        Object profile,
        List<String> permissions,
        String redirectPath
) {
}
