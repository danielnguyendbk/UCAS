package com.ucas.qlphonghoc.controller;

import com.ucas.qlphonghoc.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/users", "/api/users"})
public class UsersController extends BaseCrudController {

    public UsersController(JdbcTemplate jdbcTemplate) {
        super(
                jdbcTemplate,
                "users",
                "id",
                List.of(
                        "id",
                        "username",
                        "email",
                        "password_hash",
                        "full_name",
                        "role",
                        "is_active",
                        "last_login_at",
                        "created_at",
                        "updated_at",
                        "is_deleted"
                ),
                true,
                "id DESC"
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT
                    id,
                    username,
                    email,
                    full_name,
                    role,
                    is_active,
                    last_login_at,
                    created_at,
                    updated_at,
                    is_deleted
                FROM users
                """;
    }

    @Override
    protected String oneSelectSql() {
        return """
                SELECT
                    id,
                    username,
                    email,
                    full_name,
                    role,
                    is_active,
                    last_login_at,
                    created_at,
                    updated_at,
                    is_deleted
                FROM users
                """;
    }

    @PatchMapping("/{id}/lock")
    public ResponseEntity<ApiResponse> lockUser(@PathVariable Integer id) {
        try {
            int updated = jdbcTemplate.update(
                    """
                            UPDATE users
                            SET is_active = 0,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                              AND is_deleted = 0
                            """,
                    id
            );

            if (updated == 0) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("User not found"));
            }

            return ResponseEntity.ok(ApiResponse.ok("Lock user successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail("Server error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse> unlockUser(@PathVariable Integer id) {
        try {
            int updated = jdbcTemplate.update(
                    """
                            UPDATE users
                            SET is_active = 1,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                              AND is_deleted = 0
                            """,
                    id
            );

            if (updated == 0) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("User not found"));
            }

            return ResponseEntity.ok(ApiResponse.ok("Unlock user successfully"));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail("Server error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        try {
            String newPassword = "123456";

            if (body != null) {
                Object passwordValue = body.getOrDefault(
                        "password",
                        body.getOrDefault("newPassword", null)
                );

                if (passwordValue != null) {
                    newPassword = String.valueOf(passwordValue).trim();
                }
            }

            if (newPassword.isBlank()) {
                newPassword = "123456";
            }

            if (newPassword.length() < 6) {
                return ResponseEntity
                        .badRequest()
                        .body(ApiResponse.fail("Password must have at least 6 characters"));
            }

            int updated = jdbcTemplate.update(
                    """
                            UPDATE users
                            SET password_hash = ?,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                              AND is_deleted = 0
                            """,
                    newPassword,
                    id
            );

            if (updated == 0) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("User not found"));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("temporaryPassword", newPassword);

            return ResponseEntity.ok(
                    ApiResponse.ok("Reset password successfully", data)
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.fail("Server error", e.getMessage()));
        }
    }
}