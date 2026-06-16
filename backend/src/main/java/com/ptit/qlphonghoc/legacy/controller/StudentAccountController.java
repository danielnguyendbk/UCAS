package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

    public StudentAccountController(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/student-account")
    @Transactional
    public ResponseEntity<Map<String, Object>> createStudentAccount(@RequestBody Map<String, Object> request) {
        String username = text(first(request, "username"));
        String password = text(first(request, "password"));
        String email = text(first(request, "email"));
        String fullName = text(first(request, "full_name", "fullName", "name"));
        String studentCode = text(first(request, "student_code", "studentCode"));
        String className = text(first(request, "class_name", "className"));
        String phone = text(first(request, "phone"));

        Integer departmentId = integerValue(first(request, "department_id", "departmentId", "faculty_id", "facultyId"));
        Integer courseYear = integerValue(first(request, "course_year", "courseYear"));
        String status = statusValue(first(request, "status", "is_active", "isActive"));

        if (password.isBlank()) password = "123456";

        String validationError = validateStudentRequest(username, password, email, studentCode, departmentId, className);
        if (!validationError.isBlank()) return ResponseEntity.badRequest().body(response(false, validationError, null));

        if (existsPlain("users", "username", username)) return ResponseEntity.badRequest().body(response(false, "Tên đăng nhập đã tồn tại.", null));
        if (existsPlain("users", "email", email)) return ResponseEntity.badRequest().body(response(false, "Email đã tồn tại.", null));
        if (existsActive("students", "student_code", studentCode)) return ResponseEntity.badRequest().body(response(false, "Mã sinh viên đã tồn tại.", null));
        if (!existsDepartment(departmentId)) return ResponseEntity.badRequest().body(response(false, "Khoa/Bộ môn không tồn tại.", null));

        Integer userId = insertUser(username, email, password, status);

        jdbcTemplate.update(
                """
                        INSERT INTO students
                            (user_id, department_id, student_code, class_name, course_year, phone, is_deleted)
                        VALUES
                            (?, ?, ?, ?, ?, ?, 0)
                        """,
                userId, departmentId, studentCode, className, courseYear, phone.isBlank() ? null : phone);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", userId);
        data.put("username", username);
        data.put("fullName", fullName.isBlank() ? username : fullName);
        data.put("studentCode", studentCode);
        data.put("className", className);
        data.put("departmentId", departmentId);
        data.put("facultyId", departmentId);

        return ResponseEntity.ok(response(true, "Tạo tài khoản sinh viên thành công.", data));
    }

    private String validateStudentRequest(String username, String password, String email,
                                          String studentCode, Integer departmentId, String className) {
        if (username.isBlank()) return "Tên đăng nhập không được để trống.";
        if (password.isBlank() || password.length() < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
        if (email.isBlank()) return "Email sinh viên không được để trống.";
        if (!email.contains("@")) return "Email sinh viên không hợp lệ.";
        if (studentCode.isBlank()) return "Mã sinh viên không được để trống.";
        if (departmentId == null) return "Vui lòng chọn khoa/bộ môn của sinh viên.";
        if (className.isBlank()) return "Lớp của sinh viên không được để trống.";
        return "";
    }

    private Integer insertUser(String username, String email, String password, String status) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                            INSERT INTO users
                                (username, email, password_hash, force_password_change, role, status)
                            VALUES
                                (?, ?, ?, TRUE, 'STUDENT', ?)
                            """,
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, passwordEncoder.encode(password));
            ps.setString(4, status);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Không lấy được user_id sau khi tạo tài khoản sinh viên.");
        return key.intValue();
    }

    private boolean existsPlain(String tableName, String columnName, String value) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " = ?", Integer.class, value);
        return count != null && count > 0;
    }

    private boolean existsActive(String tableName, String columnName, String value) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " = ? AND is_deleted = 0", Integer.class, value);
        return count != null && count > 0;
    }

    private boolean existsDepartment(Integer id) {
        if (id == null) return false;
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM departments WHERE department_id = ? AND is_deleted = 0", Integer.class, id);
        return count != null && count > 0;
    }

    private Object first(Map<String, Object> request, String... keys) {
        if (request == null) return null;
        for (String key : keys) if (request.containsKey(key)) return request.get(key);
        return null;
    }

    private String text(Object value) { return value == null ? "" : String.valueOf(value).trim(); }

    private Integer integerValue(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isBlank()) return null;
        try { return Integer.parseInt(text); } catch (NumberFormatException ex) { return null; }
    }

    private String statusValue(Object value) {
        if (value == null) return "ACTIVE";
        String text = String.valueOf(value).trim();
        if (text.isBlank()) return "ACTIVE";
        if ("1".equals(text) || "true".equalsIgnoreCase(text)) return "ACTIVE";
        if ("0".equals(text) || "false".equalsIgnoreCase(text)) return "INACTIVE";
        return text.toUpperCase();
    }

    private Map<String, Object> response(boolean success, String message, Object data) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", success);
        res.put("message", message);
        res.put("data", data);
        return res;
    }
}
