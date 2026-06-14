package com.ucas.qlphonghoc.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JdbcTemplate jdbcTemplate;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.mail.from:no-reply@ucas.local}")
    private String mailFrom;

    public AuthController(JdbcTemplate jdbcTemplate, JavaMailSender mailSender) {
        this.jdbcTemplate = jdbcTemplate;
        this.mailSender = mailSender;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.getOrDefault("username", "").trim();
        String password = request.getOrDefault("password", "").trim();

        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Vui lòng nhập tên đăng nhập và mật khẩu.", null));
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
                    response(false, "Tên đăng nhập hoặc mật khẩu không đúng.", null));
        }

        Map<String, Object> userRow = users.get(0);

        if (!isTruthy(userRow.get("is_active"))) {
            return ResponseEntity.status(403).body(
                    response(false, "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.", null));
        }

        String storedPassword = String.valueOf(userRow.get("password_hash"));

        // DEV MODE: hiện tại hệ thống đang lưu password_hash dạng plain text.
        // Sau khi ổn định nên chuyển sang BCrypt.
        if (!password.equals(storedPassword)) {
            return ResponseEntity.status(401).body(
                    response(false, "Tên đăng nhập hoặc mật khẩu không đúng.", null));
        }

        jdbcTemplate.update(
                "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
                userRow.get("id"));

        Map<String, Object> user = toUserProfile(userRow);

        Map<String, Object> data = new HashMap<>();
        data.put("token", "dev-token-" + userRow.get("id"));
        data.put("user", user);

        return ResponseEntity.ok(
                response(true, "Đăng nhập thành công.", data));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Integer userId = extractUserIdFromDevToken(authorization);

        if (userId == null) {
            return ResponseEntity.status(401).body(
                    response(false, "Chưa đăng nhập hoặc token không hợp lệ.", null));
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
                    response(false, "Không tìm thấy tài khoản.", null));
        }

        return ResponseEntity.ok(
                response(true, "Lấy thông tin hồ sơ thành công.", toUserProfile(users.get(0))));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, String> request) {
        Integer userId = extractUserIdFromDevToken(authorization);

        if (userId == null) {
            return ResponseEntity.status(401).body(
                    response(false, "Chưa đăng nhập hoặc token không hợp lệ.", null));
        }

        String fullName = request.getOrDefault(
                "fullName",
                request.getOrDefault("full_name", "")).trim();

        String email = request.getOrDefault("email", "").trim();

        if (fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Họ tên không được để trống.", null));
        }

        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Email không được để trống.", null));
        }

        Integer duplicatedEmailCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM users
                        WHERE email = ?
                          AND id <> ?
                          AND is_deleted = FALSE
                        """,
                Integer.class,
                email,
                userId);

        if (duplicatedEmailCount != null && duplicatedEmailCount > 0) {
            return ResponseEntity.badRequest().body(
                    response(false, "Email đã được sử dụng bởi tài khoản khác.", null));
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
                response(true, "Cập nhật hồ sơ thành công.", toUserProfile(updatedUser)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, String> request) {
        Integer userId = extractUserIdFromDevToken(authorization);

        if (userId == null) {
            return ResponseEntity.status(401).body(
                    response(false, "Chưa đăng nhập hoặc token không hợp lệ.", null));
        }

        String currentPassword = request.getOrDefault("currentPassword", "").trim();
        String newPassword = request.getOrDefault("newPassword", "").trim();
        String confirmPassword = request.getOrDefault("confirmPassword", "").trim();

        if (currentPassword.isEmpty() || newPassword.isEmpty() || confirmPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu.",
                            null));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(
                    response(false, "Mật khẩu mới phải có ít nhất 6 ký tự.", null));
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(
                    response(false, "Xác nhận mật khẩu mới không khớp.", null));
        }

        if (currentPassword.equals(newPassword)) {
            return ResponseEntity.badRequest().body(
                    response(false, "Mật khẩu mới không được trùng với mật khẩu hiện tại.", null));
        }

        String sql = """
                SELECT
                    id,
                    password_hash,
                    is_active
                FROM users
                WHERE id = ?
                  AND is_deleted = FALSE
                LIMIT 1
                """;

        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql, userId);

        if (users.isEmpty()) {
            return ResponseEntity.status(404).body(
                    response(false, "Không tìm thấy tài khoản.", null));
        }

        Map<String, Object> userRow = users.get(0);

        if (!isTruthy(userRow.get("is_active"))) {
            return ResponseEntity.status(403).body(
                    response(false, "Tài khoản đã bị khóa.", null));
        }

        String storedPassword = String.valueOf(userRow.get("password_hash"));

        if (!currentPassword.equals(storedPassword)) {
            return ResponseEntity.status(400).body(
                    response(false, "Mật khẩu hiện tại không đúng.", null));
        }

        jdbcTemplate.update(
                """
                        UPDATE users
                        SET password_hash = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                          AND is_deleted = FALSE
                        """,
                newPassword,
                userId);

        return ResponseEntity.ok(
                response(true, "Đổi mật khẩu thành công.", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.getOrDefault("email", "").trim();

        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Vui lòng nhập email tài khoản.", null));
        }

        String userSql = """
                SELECT id, username, email, full_name, is_active
                FROM users
                WHERE email = ?
                  AND is_deleted = FALSE
                LIMIT 1
                """;

        List<Map<String, Object>> users = jdbcTemplate.queryForList(userSql, email);

        // Không tiết lộ email có tồn tại hay không.
        if (users.isEmpty()) {
            return ResponseEntity.ok(
                    response(true, "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.", null));
        }

        Map<String, Object> user = users.get(0);

        if (!isTruthy(user.get("is_active"))) {
            return ResponseEntity.status(403).body(
                    response(false, "Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.", null));
        }

        Integer userId = Number.class.cast(user.get("id")).intValue();
        String rawToken = generateSecureToken();
        String tokenHash = sha256(rawToken);

        jdbcTemplate.update(
                """
                        UPDATE password_reset_tokens
                        SET used_at = CURRENT_TIMESTAMP
                        WHERE user_id = ?
                          AND used_at IS NULL
                        """,
                userId);

        jdbcTemplate.update(
                """
                        INSERT INTO password_reset_tokens
                            (user_id, token_hash, expires_at, used_at)
                        VALUES
                            (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), NULL)
                        """,
                userId,
                tokenHash);

        String resetLink = frontendBaseUrl + "/login?resetToken=" + rawToken;

        try {
            sendResetPasswordEmail(
                    String.valueOf(user.get("email")),
                    String.valueOf(user.get("full_name")),
                    resetLink);
        } catch (MailException ex) {
            return ResponseEntity.status(500).body(
                    response(false, "Không gửi được email đặt lại mật khẩu. Vui lòng kiểm tra cấu hình SMTP.",
                            ex.getMessage()));
        }

        return ResponseEntity.ok(
                response(true, "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.getOrDefault("token", "").trim();
        String newPassword = request.getOrDefault("newPassword", "").trim();
        String confirmPassword = request.getOrDefault("confirmPassword", "").trim();

        if (token.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Token đặt lại mật khẩu không hợp lệ.", null));
        }

        if (newPassword.isEmpty() || confirmPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.", null));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(
                    response(false, "Mật khẩu mới phải có ít nhất 6 ký tự.", null));
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(
                    response(false, "Xác nhận mật khẩu mới không khớp.", null));
        }

        String tokenHash = sha256(token);

        String tokenSql = """
                SELECT
                    prt.id,
                    prt.user_id,
                    prt.expires_at,
                    prt.used_at,
                    u.is_active
                FROM password_reset_tokens prt
                JOIN users u ON u.id = prt.user_id
                WHERE prt.token_hash = ?
                  AND u.is_deleted = FALSE
                LIMIT 1
                """;

        List<Map<String, Object>> tokens = jdbcTemplate.queryForList(tokenSql, tokenHash);

        if (tokens.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Liên kết đặt lại mật khẩu không hợp lệ.", null));
        }

        Map<String, Object> resetToken = tokens.get(0);

        if (resetToken.get("used_at") != null) {
            return ResponseEntity.badRequest().body(
                    response(false, "Liên kết đặt lại mật khẩu đã được sử dụng.", null));
        }

        Object expiresAtObject = resetToken.get("expires_at");
        LocalDateTime expiresAt = null;

        if (expiresAtObject instanceof java.sql.Timestamp timestamp) {
            expiresAt = timestamp.toLocalDateTime();
        } else if (expiresAtObject instanceof LocalDateTime localDateTime) {
            expiresAt = localDateTime;
        }

        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(
                    response(false, "Liên kết đặt lại mật khẩu đã hết hạn.", null));
        }

        if (!isTruthy(resetToken.get("is_active"))) {
            return ResponseEntity.status(403).body(
                    response(false, "Tài khoản đang bị khóa. Vui lòng liên hệ quản trị viên.", null));
        }

        Integer userId = Number.class.cast(resetToken.get("user_id")).intValue();
        Integer tokenId = Number.class.cast(resetToken.get("id")).intValue();

        jdbcTemplate.update(
                """
                        UPDATE users
                        SET password_hash = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                          AND is_deleted = FALSE
                        """,
                newPassword,
                userId);

        jdbcTemplate.update(
                """
                        UPDATE password_reset_tokens
                        SET used_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """,
                tokenId);

        return ResponseEntity.ok(
                response(true, "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.", null));
    }

    private void sendResetPasswordEmail(String to, String fullName, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("UCAS - Đặt lại mật khẩu");

        message.setText("""
                Xin chào %s,

                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản UCAS của bạn.

                Vui lòng bấm vào liên kết dưới đây để đặt lại mật khẩu:
                %s

                Liên kết này có hiệu lực trong 30 phút và chỉ sử dụng được một lần.

                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

                UCAS Management
                """.formatted(fullName == null || fullName.isBlank() ? "bạn" : fullName, resetLink));

        mailSender.send(message);
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedHash);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot hash token", ex);
        }
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