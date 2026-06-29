package com.ptit.qlphonghoc.common.exception;

import com.ptit.qlphonghoc.common.response.ErrorResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;
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


    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataAccessException exception) {
        String rawMessage = extractRootMessage(exception);
        String lower = rawMessage == null ? "" : rawMessage.toLowerCase();

        String message = "D\u1eef li\u1ec7u kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c \u0111ang b\u1ecb r\u00e0ng bu\u1ed9c b\u1edfi d\u1eef li\u1ec7u li\u00ean quan.";

        if (lower.contains("duplicate entry") && (lower.contains("course_code") || lower.contains("courses"))) {
            message = "M\u00e3 m\u00f4n h\u1ecdc \u0111\u00e3 t\u1ed3n t\u1ea1i. Vui l\u00f2ng nh\u1eadp m\u00e3 m\u00f4n h\u1ecdc kh\u00e1c.";
        } else if (lower.contains("duplicate entry")) {
            message = "D\u1eef li\u1ec7u \u0111\u00e3 t\u1ed3n t\u1ea1i trong h\u1ec7 th\u1ed1ng. Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i m\u00e3 ho\u1eb7c th\u00f4ng tin \u0111\u1ecbnh danh.";
        } else if (rawMessage != null && rawMessage.contains("Kh\u00f4ng th\u1ec3 x\u00f3a ph\u00f2ng h\u1ecdc")) {
            message = extractTriggerMessage(rawMessage, "Kh\u00f4ng th\u1ec3 x\u00f3a ph\u00f2ng h\u1ecdc");
        } else if (rawMessage != null && rawMessage.contains("Kh\u00f4ng th\u1ec3 g\u00e1n l\u1ecbch v\u00e0o ph\u00f2ng h\u1ecdc")) {
            message = extractTriggerMessage(rawMessage, "Kh\u00f4ng th\u1ec3 g\u00e1n l\u1ecbch v\u00e0o ph\u00f2ng h\u1ecdc");
        } else if (rawMessage != null && rawMessage.contains("Kh\u00f4ng th\u1ec3 x\u00f3a ho\u1eb7c v\u00f4 hi\u1ec7u h\u00f3a m\u00f4n h\u1ecdc")) {
            message = extractTriggerMessage(rawMessage, "Kh\u00f4ng th\u1ec3 x\u00f3a ho\u1eb7c v\u00f4 hi\u1ec7u h\u00f3a m\u00f4n h\u1ecdc");
        } else if (rawMessage != null && rawMessage.contains("Kh\u00f4ng th\u1ec3 x\u00f3a c\u1ee9ng m\u00f4n h\u1ecdc")) {
            message = extractTriggerMessage(rawMessage, "Kh\u00f4ng th\u1ec3 x\u00f3a c\u1ee9ng m\u00f4n h\u1ecdc");
        }

        return build(
                HttpStatus.CONFLICT,
                "DATA_CONSTRAINT_VIOLATION",
                message,
                rawMessage,
                null
        );
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


    private String extractRootMessage(Throwable exception) {
        Throwable current = exception;
        Throwable last = exception;

        while (current != null) {
            last = current;
            current = current.getCause();
        }

        if (last instanceof SQLException sqlException) {
            return sqlException.getMessage();
        }

        return last != null && last.getMessage() != null
                ? last.getMessage()
                : exception.getMessage();
    }

    private String extractTriggerMessage(String rawMessage, String startText) {
        int start = rawMessage.indexOf(startText);
        if (start < 0) {
            return rawMessage;
        }

        String message = rawMessage.substring(start).trim();

        int quote = message.indexOf("'");
        if (quote > 0) {
            message = message.substring(0, quote).trim();
        }

        int semicolon = message.indexOf(";");
        if (semicolon > 0) {
            message = message.substring(0, semicolon).trim();
        }

        return message;
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
            case "EXAM_ROOM_CONFLICT" -> "Phòng đã có lịch thi trong cùng thời gian";
            case "MAINTENANCE_BLOCK_CONFLICT" -> "Phòng đang có sự cố hoặc bảo trì chưa xử lý";
            case "LECTURER_TIME_CONFLICT" -> "Giảng viên bị trùng lịch dạy";
            case "ROOM_TYPE_MISMATCH" -> "Loại phòng không phù hợp với yêu cầu lớp học";
            case "ROOM_INACTIVE_OR_DELETED" -> "Phòng học không hoạt động hoặc đã bị xóa";
            case "ROOM_NOT_FOUND" -> "Không tìm thấy phòng học";
            case "CALENDAR_BLOCK_CONFLICT" -> "Lịch học trùng với ngày nghỉ hoặc lịch khóa";
            case "INVALID_WEEK_RANGE" -> "Khoảng tuần học không hợp lệ";
            case "INVALID_TIME_RANGE" -> "Khoảng tiết học không hợp lệ";
            case "PAST_TIME_NOT_ALLOWED" -> "Không thể thao tác với thời gian trong quá khứ";
            case "INVALID_REQUEST_STATUS" -> "Trạng thái yêu cầu không hợp lệ cho thao tác này";
            case "FORBIDDEN_OPERATION" -> "Bạn không có quyền thực hiện thao tác này";

            case "SCHEDULE_NOT_FOUND" -> "Không tìm thấy lịch học";
            case "CLASSROOM_NOT_FOUND" -> "Không tìm thấy phòng học";
            case "REQUEST_NOT_FOUND" -> "Không tìm thấy yêu cầu";
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
