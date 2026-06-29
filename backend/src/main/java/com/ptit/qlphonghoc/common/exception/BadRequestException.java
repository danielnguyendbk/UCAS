package com.ptit.qlphonghoc.common.exception;

public class BadRequestException extends RuntimeException {

    private final String errorCode;
    private final Object details;

    public BadRequestException(String message) {
        this("BAD_REQUEST", message, null);
    }

    public BadRequestException(String errorCode, String message) {
        this(errorCode, message, null);
    }

    public BadRequestException(String errorCode, String message, Object details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public Object getDetails() {
        return details;
    }
}
