package com.ucas.qlphonghoc.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class StudentAccountController {

    private final JdbcTemplate jdbcTemplate;

    public StudentAccountController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/student-account")
    @Transactional
    public ResponseEntity<Map<String, Object>> createStudentAccount(
            @RequestBody Map<String, Object> request) {
        String username = text(request.get("username"));
        String password = text(request.get("password"));
        String email = text(request.get("email"));
        String fullName = text(request.get("full_name"));
        String studentCode = text(request.get("student_code"));
        String className = text(request.get("class_name"));
        String phone = text(request.get("phone"));

        Integer facultyId = integerValue(request.get("faculty_id"));
        Integer courseYear = integerValue(request.get("course_year"));
        Integer isActive = integerValue(request.get("is_active"));

        if (password.isBlank()) {
            password = "123456";
        }

        if (isActive == null) {
            isActive = 1;
        }

        String validationError = validateStudentRequest(
                username,
                password,
                email,
                fullName,
                studentCode,
                facultyId,
                className);

        if (!validationError.isBlank()) {
            return ResponseEntity.badRequest().body(
                    response(false, validationError, null));
        }

        if (exists("users", "username", username)) {
            return ResponseEntity.badRequest().body(
                    response(false, "Tên đăng nhập đã tồn tại.", null));
        }

        if (exists("users", "email", email)) {
            return ResponseEntity.badRequest().body(
                    response(false, "Email đã tồn tại.", null));
        }

        if (exists("students", "student_code", studentCode)) {
            return ResponseEntity.badRequest().body(
                    response(false, "Mã sinh viên đã tồn tại.", null));
        }

        if (!existsById("faculties", facultyId)) {
            return ResponseEntity.badRequest().body(
                    response(false, "Khoa không tồn tại.", null));
        }

        Integer userId = insertUser(
                username,
                email,
                password,
                fullName,
                isActive);

        jdbcTemplate.update(
                """
                        INSERT INTO students
                            (user_id, faculty_id, student_code, class_name, course_year, phone, is_deleted)
                        VALUES
                            (?, ?, ?, ?, ?, ?, 0)
                        """,
                userId,
                facultyId,
                studentCode,
                className,
                courseYear,
                phone.isBlank() ? null : phone);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", userId);
        data.put("username", username);
        data.put("studentCode", studentCode);
        data.put("className", className);

        return ResponseEntity.ok(
                response(true, "Tạo tài khoản sinh viên thành công.", data));
    }

    private String validateStudentRequest(
            String username,
            String password,
            String email,
            String fullName,
            String studentCode,
            Integer facultyId,
            String className) {
        if (username.isBlank()) {
            return "Tên đăng nhập không được để trống.";
        }

        if (password.isBlank() || password.length() < 6) {
            return "Mật khẩu phải có ít nhất 6 ký tự.";
        }

        if (email.isBlank()) {
            return "Email sinh viên không được để trống.";
        }

        if (!email.contains("@")) {
            return "Email sinh viên không hợp lệ.";
        }

        if (fullName.isBlank()) {
            return "Họ và tên sinh viên không được để trống.";
        }

        if (studentCode.isBlank()) {
            return "Mã sinh viên không được để trống.";
        }

        if (facultyId == null) {
            return "Vui lòng chọn khoa của sinh viên.";
        }

        if (className.isBlank()) {
            return "Lớp của sinh viên không được để trống. Sinh viên bắt buộc phải thuộc một lớp.";
        }

        return "";
    }

    private Integer insertUser(
            String username,
            String email,
            String password,
            String fullName,
            Integer isActive) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                            INSERT INTO users
                                (username, email, password_hash, full_name, role, is_active, is_deleted)
                            VALUES
                                (?, ?, ?, ?, 'STUDENT', ?, 0)
                            """,
                    Statement.RETURN_GENERATED_KEYS);

            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, password);
            ps.setString(4, fullName);
            ps.setInt(5, isActive == null ? 1 : isActive);

            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();

        if (key == null) {
            throw new IllegalStateException("Không lấy được user_id sau khi tạo tài khoản sinh viên.");
        }

        return key.intValue();
    }

    private boolean exists(String tableName, String columnName, String value) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " = ? AND is_deleted = 0",
                Integer.class,
                value);

        return count != null && count > 0;
    }

    private boolean existsById(String tableName, Integer id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE id = ? AND is_deleted = 0",
                Integer.class,
                id);

        return count != null && count > 0;
    }

    private String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private Integer integerValue(Object value) {
        if (value == null) {
            return null;
        }

        String text = String.valueOf(value).trim();

        if (text.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Map<String, Object> response(boolean success, String message, Object data) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", success);
        res.put("message", message);
        res.put("data", data);
        return res;
    }
}