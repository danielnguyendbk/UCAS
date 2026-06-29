package com.ptit.qlphonghoc.legacy.controller;

import com.ptit.qlphonghoc.legacy.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/users", "/api/users"})
public class UsersController extends BaseCrudController {

    private final PasswordEncoder passwordEncoder;

    public UsersController(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        super(jdbcTemplate, "users", "user_id",
                List.of("user_id", "username", "email", "password_hash", "force_password_change", "role", "status", "created_at", "updated_at"),
                false, "user_id DESC");
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "user_id", List.of("id"),
                "status", List.of("is_active", "active")
        );
    }

    @Override
    protected Object readBody(Map<String, Object> body, String snakeKey) {
        if ("password_hash".equals(snakeKey)) {
            Object value = body == null ? null : body.getOrDefault("password_hash", body.getOrDefault("passwordHash", body.get("password")));
            if (value == null) return null;
            String raw = String.valueOf(value).trim();
            if (raw.isBlank()) return null;
            if (raw.startsWith("$2a$") || raw.startsWith("$2b$") || raw.startsWith("$2y$")) return raw;
            return passwordEncoder.encode(raw);
        }
        if ("status".equals(snakeKey)) {
            Object value = super.readBody(body, snakeKey);
            if (value == null) return null;
            String text = String.valueOf(value).trim();
            if ("1".equals(text) || "true".equalsIgnoreCase(text)) return "ACTIVE";
            if ("0".equals(text) || "false".equalsIgnoreCase(text)) return "INACTIVE";
            return text.toUpperCase();
        }
        return super.readBody(body, snakeKey);
    }

    @Override
    protected boolean hasBodyKey(Map<String, Object> body, String snakeKey) {
        if ("password_hash".equals(snakeKey)) {
            return body != null && (body.containsKey("password_hash") || body.containsKey("passwordHash") || body.containsKey("password"));
        }
        return super.hasBodyKey(body, snakeKey);
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT u.user_id,
                       u.user_id AS id,
                       u.username,
                       u.email,
                       COALESCE(l.full_name, s.student_code, fs.staff_code, u.username) AS full_name,
                       u.role,
                       u.status,
                       CASE WHEN u.status = 'ACTIVE' THEN 1 ELSE 0 END AS is_active,
                       u.force_password_change,
                       u.created_at,
                       u.updated_at,
                       0 AS is_deleted
                FROM users u
                LEFT JOIN lecturers l ON l.user_id = u.user_id AND l.is_deleted = 0
                LEFT JOIN students s ON s.user_id = u.user_id AND s.is_deleted = 0
                LEFT JOIN facility_staff fs ON fs.user_id = u.user_id AND fs.is_deleted = 0
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String idColumnForPath() { return "u.user_id"; }

    @Override
    public ResponseEntity<ApiResponse> delete(@PathVariable Object id) {
        try {
            int updated = jdbcTemplate.update("UPDATE users SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", id);
            if (updated == 0) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("User not found"));
            return ResponseEntity.ok(ApiResponse.ok("Deactivate user successfully"));
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<ApiResponse> lockUser(@PathVariable Integer id) {
        return updateStatus(id, "LOCKED", "Lock user successfully");
    }

    @PatchMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse> unlockUser(@PathVariable Integer id) {
        return updateStatus(id, "ACTIVE", "Unlock user successfully");
    }

    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@PathVariable Integer id,
                                                     @RequestBody(required = false) Map<String, Object> body) {
        try {
            String newPassword = "123456";
            if (body != null) {
                Object passwordValue = body.getOrDefault("password", body.getOrDefault("newPassword", null));
                if (passwordValue != null) newPassword = String.valueOf(passwordValue).trim();
            }
            if (newPassword.isBlank()) newPassword = "123456";
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(ApiResponse.fail("Password must have at least 6 characters"));
            }

            int updated = jdbcTemplate.update(
                    """
                            UPDATE users
                            SET password_hash = ?,
                                force_password_change = TRUE,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE user_id = ?
                            """,
                    passwordEncoder.encode(newPassword), id);

            if (updated == 0) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("User not found"));

            Map<String, Object> data = new HashMap<>();
            data.put("temporaryPassword", newPassword);
            return ResponseEntity.ok(ApiResponse.ok("Reset password successfully", data));
        } catch (Exception e) {
            return serverError(e);
        }
    }

    private ResponseEntity<ApiResponse> updateStatus(Integer id, String status, String message) {
        try {
            int updated = jdbcTemplate.update(
                    "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                    status, id);
            if (updated == 0) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("User not found"));
            return ResponseEntity.ok(ApiResponse.ok(message));
        } catch (Exception e) {
            return serverError(e);
        }
    }
}
