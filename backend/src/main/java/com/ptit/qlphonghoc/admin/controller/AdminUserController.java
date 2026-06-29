package com.ptit.qlphonghoc.admin.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminUserController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status
    ) {
        String sql = """
            SELECT
                u.user_id AS id,
                u.username,
                u.email,
                u.role,
                u.status,
                COALESCE(l.full_name, u.username) AS fullName,
                COALESCE(l.lecturer_code, s.student_code, fs.staff_code, u.username) AS profileCode,
                COALESCE(ld.department_code, sd.department_code) AS departmentCode,
                COALESCE(ld.department_name, sd.department_name) AS departmentName,
                u.created_at AS createdAt,
                u.updated_at AS updatedAt
            FROM users u
            LEFT JOIN lecturers l ON l.user_id = u.user_id AND l.is_deleted = FALSE
            LEFT JOIN departments ld ON ld.department_id = l.department_id AND ld.is_deleted = FALSE
            LEFT JOIN students s ON s.user_id = u.user_id AND s.is_deleted = FALSE
            LEFT JOIN departments sd ON sd.department_id = s.department_id AND sd.is_deleted = FALSE
            LEFT JOIN facility_staff fs ON fs.user_id = u.user_id AND fs.is_deleted = FALSE
            WHERE (:role IS NULL OR :role = '' OR u.role = :role)
              AND (:status IS NULL OR :status = '' OR u.status = :status)
            ORDER BY u.created_at DESC, u.user_id DESC
            """;

        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                sql,
                Map.of(
                        "role", normalize(role),
                        "status", normalize(status)
                )
        );
        return ApiResponse.success("OK", users);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
