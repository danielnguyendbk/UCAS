package com.ptit.qlphonghoc.common.exception;

public class ResourceNotFoundException extends RuntimeException {

    private final String errorCode;
    private final Object details;

    public ResourceNotFoundException(String message) {
        this("RESOURCE_NOT_FOUND", message, null);
    }

    public ResourceNotFoundException(String errorCode, String message) {
        this(errorCode, message, null);
    }

    public ResourceNotFoundException(String errorCode, String message, Object details) {
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
