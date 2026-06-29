package com.ptit.qlphonghoc.common.response;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
        boolean success,
        String errorCode,
        String message,
        Object details,
        Map<String, String> errors,
        LocalDateTime timestamp
) {
    public ErrorResponse(
            boolean success,
            String message,
            Map<String, String> errors,
            LocalDateTime timestamp
    ) {
        this(success, null, message, errors, errors, timestamp);
    }
}
