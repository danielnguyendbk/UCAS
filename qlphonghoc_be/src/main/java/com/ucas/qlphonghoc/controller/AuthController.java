package com.ucas.qlphonghoc.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JdbcTemplate jdbcTemplate;

    public AuthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.getOrDefault("username", "").trim();
        String password = request.getOrDefault("password", "").trim();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Tên đăng nhập và mật khẩu không được để trống", null));
        }

        String sql = """
                SELECT
                    id,
                    username,
                    email,
                    password_hash,
                    full_name,
                    role,
                    is_active,
                    created_at,
                    updated_at,
                    last_login_at
                FROM users
                WHERE username = ?
                  AND is_deleted = FALSE
                LIMIT 1
                """;

        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, username);

        if (users.isEmpty()) {
            return ResponseEntity.status(401).body(
                    response(false, "Tên đăng nhập hoặc mật khẩu không đúng", null));
        }

        Map<String, Object> userRow = users.get(0);

        if (!isTruthy(userRow.get("is_active"))) {
            return ResponseEntity.status(403).body(
                    response(false, "Tài khoản đã bị khóa", null));
        }

        String storedPassword = String.valueOf(userRow.get("password_hash"));

        // DEV MODE: tạm so sánh plain text để test.
        // Sau khi ổn sẽ đổi sang BCrypt.
        if (!password.equals(storedPassword)) {
            return ResponseEntity.status(401).body(
                    response(false, "Tên đăng nhập hoặc mật khẩu không đúng", null));
        }

        jdbcTemplate.update(
                "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
                userRow.get("id"));

        Map<String, Object> user = toUserProfile(userRow);

        Map<String, Object> data = new HashMap<>();
        data.put("token", "dev-token-" + userRow.get("id"));
        data.put("user", user);

        return ResponseEntity.ok(
                response(true, "Đăng nhập thành công", data));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Integer userId = extractUserIdFromDevToken(authorization);

        if (userId == null) {
            return ResponseEntity.status(401).body(
                    response(false, "Chưa đăng nhập hoặc token không hợp lệ", null));
        }

        String sql = """
                SELECT
                    id,
                    username,
                    email,
                    full_name,
                    role,
                    is_active,
                    created_at,
                    updated_at,
                    last_login_at
                FROM users
                WHERE id = ?
                  AND is_deleted = FALSE
                LIMIT 1
                """;

        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, userId);

        if (users.isEmpty()) {
            return ResponseEntity.status(404).body(
                    response(false, "Không tìm thấy tài khoản", null));
        }

        return ResponseEntity.ok(
                response(true, "Lấy thông tin hồ sơ thành công", toUserProfile(users.get(0))));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, String> request) {
        Integer userId = extractUserIdFromDevToken(authorization);

        if (userId == null) {
            return ResponseEntity.status(401).body(
                    response(false, "Chưa đăng nhập hoặc token không hợp lệ", null));
        }

        String fullName = request.getOrDefault("fullName", request.getOrDefault("full_name", "")).trim();
        String email = request.getOrDefault("email", "").trim();

        if (fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Họ tên không được để trống", null));
        }

        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Email không được để trống", null));
        }

        Integer duplicatedEmailCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ? AND id <> ? AND is_deleted = FALSE",
                Integer.class,
                email,
                userId);

        if (duplicatedEmailCount != null && duplicatedEmailCount > 0) {
            return ResponseEntity.badRequest().body(
                    response(false, "Email đã được sử dụng bởi tài khoản khác", null));
        }

        jdbcTemplate.update(
                """
                        UPDATE users
                        SET full_name = ?,
                            email = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                          AND is_deleted = FALSE
                        """,
                fullName,
                email,
                userId);

        String sql = """
                SELECT
                    id,
                    username,
                    email,
                    full_name,
                    role,
                    is_active,
                    created_at,
                    updated_at,
                    last_login_at
                FROM users
                WHERE id = ?
                  AND is_deleted = FALSE
                LIMIT 1
                """;

        Map<String, Object> updatedUser = jdbcTemplate.queryForList(sql, userId).get(0);

        return ResponseEntity.ok(
                response(true, "Cập nhật hồ sơ thành công", toUserProfile(updatedUser)));
    }

    private Integer extractUserIdFromDevToken(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return null;
        }

        String token = authorization.trim();

        if (token.startsWith("Bearer ")) {
            token = token.substring(7).trim();
        }

        if (!token.startsWith("dev-token-")) {
            return null;
        }

        try {
            return Integer.parseInt(token.substring("dev-token-".length()));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Map<String, Object> toUserProfile(Map<String, Object> userRow) {
        Map<String, Object> user = new HashMap<>();

        user.put("id", userRow.get("id"));
        user.put("username", userRow.get("username"));
        user.put("email", userRow.get("email"));

        user.put("fullName", userRow.get("full_name"));
        user.put("full_name", userRow.get("full_name"));

        user.put("role", userRow.get("role"));
        user.put("isActive", userRow.get("is_active"));
        user.put("is_active", userRow.get("is_active"));

        user.put("createdAt", userRow.get("created_at"));
        user.put("created_at", userRow.get("created_at"));

        user.put("updatedAt", userRow.get("updated_at"));
        user.put("updated_at", userRow.get("updated_at"));

        user.put("lastLoginAt", userRow.get("last_login_at"));
        user.put("last_login_at", userRow.get("last_login_at"));

        return user;
    }

    private boolean isTruthy(Object value) {
        return Boolean.TRUE.equals(value)
                || Integer.valueOf(1).equals(value)
                || Byte.valueOf((byte) 1).equals(value)
                || Short.valueOf((short) 1).equals(value)
                || "1".equals(String.valueOf(value))
                || "true".equalsIgnoreCase(String.valueOf(value));
    }

    private Map<String, Object> response(boolean success, String message, Object data) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", success);
        res.put("message", message);
        res.put("data", data);
        return res;
    }
}