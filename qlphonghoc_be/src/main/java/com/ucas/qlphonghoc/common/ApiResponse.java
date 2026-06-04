package com.ucas.qlphonghoc.common;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;
    private String error;

    public ApiResponse(boolean success, String message, Object data, String error) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
    }

    public static ApiResponse ok(String message, Object data) {
        return new ApiResponse(true, message, data, null);
    }

    public static ApiResponse ok(String message) {
        return new ApiResponse(true, message, null, null);
    }

    public static ApiResponse fail(String message) {
        return new ApiResponse(false, message, null, null);
    }

    public static ApiResponse fail(String message, String error) {
        return new ApiResponse(false, message, null, error);
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public Object getData() { return data; }
    public String getError() { return error; }
}
