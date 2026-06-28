package com.ptit.qlphonghoc.common.exception;

import com.ptit.qlphonghoc.common.response.ErrorResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        return build(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "Dữ liệu không hợp lệ",
                errors,
                errors
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {
        return build(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_FAILED",
                "Dữ liệu không hợp lệ: " + exception.getMessage(),
                null,
                null
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException exception) {
        return build(
                HttpStatus.BAD_REQUEST,
                exception.getErrorCode(),
                toVietnameseMessage(exception.getErrorCode(), exception.getMessage()),
                exception.getDetails(),
                null
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(RuntimeException exception) {
        return build(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "Tên đăng nhập hoặc mật khẩu không đúng",
                null,
                null
        );
    }

    @ExceptionHandler(InactiveAccountException.class)
    public ResponseEntity<ErrorResponse> handleInactiveAccount(InactiveAccountException exception) {
        return build(
                HttpStatus.FORBIDDEN,
                "ACCOUNT_INACTIVE",
                "Tài khoản đã bị vô hiệu hóa",
                null,
                null
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException exception) {
        return build(
                HttpStatus.NOT_FOUND,
                exception.getErrorCode(),
                toVietnameseMessage(exception.getErrorCode(), exception.getMessage()),
                exception.getDetails(),
                null
        );
    }

    @ExceptionHandler(UserProfileInconsistentException.class)
    public ResponseEntity<ErrorResponse> handleUserProfileInconsistent(UserProfileInconsistentException exception) {
        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "PROFILE_INCONSISTENT",
                "Thông tin hồ sơ người dùng không nhất quán",
                null,
                null
        );
    }

    @ExceptionHandler({ExpiredJwtException.class, JwtException.class})
    public ResponseEntity<ErrorResponse> handleJwt(RuntimeException exception) {
        return build(
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                "Phiên đăng nhập đã hết hạn hoặc không hợp lệ",
                null,
                null
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException exception) {
        return build(
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED",
                "Bạn không có quyền thực hiện thao tác này",
                null,
                null
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());

        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }

        String message = exception.getReason() == null
                ? toVietnameseHttpStatusMessage(status)
                : toVietnameseMessage(status.name(), exception.getReason());

        return build(status, status.name(), message, null, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception exception) {
        log.error("Unhandled application exception", exception);

        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau",
                null,
                null
        );
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status,
            String errorCode,
            String message,
            Object details,
            Map<String, String> errors
    ) {
        return ResponseEntity.status(status)
                .body(new ErrorResponse(
                        false,
                        errorCode,
                        message,
                        details,
                        errors,
                        LocalDateTime.now()
                ));
    }

    private String toVietnameseHttpStatusMessage(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> "Yêu cầu không hợp lệ";
            case UNAUTHORIZED -> "Bạn cần đăng nhập để thực hiện thao tác này";
            case FORBIDDEN -> "Bạn không có quyền thực hiện thao tác này";
            case NOT_FOUND -> "Không tìm thấy dữ liệu yêu cầu";
            case CONFLICT -> "Dữ liệu đang bị xung đột";
            case UNPROCESSABLE_ENTITY -> "Không thể xử lý dữ liệu yêu cầu";
            case INTERNAL_SERVER_ERROR -> "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau";
            default -> status.getReasonPhrase();
        };
    }

    private String toVietnameseMessage(String errorCode, String fallbackMessage) {
        if (errorCode == null || errorCode.isBlank()) {
            return fallbackMessage;
        }

        return switch (errorCode) {
            case "VALIDATION_FAILED" -> "Dữ liệu không hợp lệ";
            case "INVALID_CREDENTIALS" -> "Tên đăng nhập hoặc mật khẩu không đúng";
            case "ACCOUNT_INACTIVE" -> "Tài khoản đã bị vô hiệu hóa";
            case "UNAUTHORIZED" -> "Phiên đăng nhập đã hết hạn hoặc không hợp lệ";
            case "ACCESS_DENIED" -> "Bạn không có quyền thực hiện thao tác này";
            case "PROFILE_INCONSISTENT" -> "Thông tin hồ sơ người dùng không nhất quán";

            case "TIMETABLE_ALREADY_PUBLISHED" -> "Thời khóa biểu đã được công bố, không thể chỉnh sửa";
            case "TIMETABLE_LOCKED" -> "Thời khóa biểu đã bị khóa";
            case "INVALID_TIMETABLE_STATUS" -> "Trạng thái thời khóa biểu không hợp lệ";
            case "ALLOCATION_CONFLICT" -> "Lịch phân phòng đang có xung đột";
            case "CAPACITY_EXCEEDED" -> "Sức chứa phòng không đủ cho lớp học";
            case "ROOM_TIME_CONFLICT" -> "Phòng đã có lớp khác trong cùng thời gian";
            case "LECTURER_TIME_CONFLICT" -> "Giảng viên bị trùng lịch dạy";
            case "ROOM_TYPE_MISMATCH" -> "Loại phòng không phù hợp với yêu cầu lớp học";
            case "ROOM_INACTIVE_OR_DELETED" -> "Phòng học không hoạt động hoặc đã bị xóa";
            case "CALENDAR_BLOCK_CONFLICT" -> "Lịch học trùng với ngày nghỉ hoặc lịch khóa";
            case "INVALID_WEEK_RANGE" -> "Khoảng tuần học không hợp lệ";
            case "INVALID_TIME_RANGE" -> "Khoảng tiết học không hợp lệ";

            case "SCHEDULE_NOT_FOUND" -> "Không tìm thấy lịch học";
            case "CLASSROOM_NOT_FOUND" -> "Không tìm thấy phòng học";
            case "SEMESTER_NOT_FOUND" -> "Không tìm thấy học kỳ";
            case "USER_NOT_FOUND" -> "Không tìm thấy người dùng";
            case "COURSE_NOT_FOUND" -> "Không tìm thấy học phần";
            case "LECTURER_NOT_FOUND" -> "Không tìm thấy giảng viên";
            case "SECTION_NOT_FOUND" -> "Không tìm thấy lớp học phần";

            case "IMPORT_HAS_ERRORS" -> "File import còn lỗi, không thể áp dụng";
            case "IMPORT_APPLY_FAILED" -> "Áp dụng file import thất bại";
            case "IMPORT_CONFLICT" -> "Dữ liệu import bị xung đột";

            case "INTERNAL_SERVER_ERROR" -> "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau";

            default -> fallbackMessage;
        };
    }
}