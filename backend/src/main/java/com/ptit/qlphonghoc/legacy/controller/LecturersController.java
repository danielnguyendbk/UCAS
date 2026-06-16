package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/lecturers", "/api/lecturers"})
public class LecturersController extends BaseCrudController {
    public LecturersController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "lecturers", "lecturer_id",
                List.of("lecturer_id", "user_id", "department_id", "lecturer_code", "full_name", "email", "phone", "created_at", "updated_at", "is_deleted"),
                true, "l.lecturer_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "lecturer_id", List.of("id"),
                "lecturer_code", List.of("staff_code", "code"),
                "full_name", List.of("name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT l.*,
                       l.lecturer_id AS id,
                       l.lecturer_code AS staff_code,
                       l.lecturer_code AS code,
                       l.full_name AS name,
                       d.department_name,
                       d.department_code,
                       u.username,
                       u.role,
                       u.status AS user_status
                FROM lecturers l
                JOIN departments d ON l.department_id = d.department_id
                JOIN users u ON l.user_id = u.user_id
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String selectWhere() { return "l.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "l.lecturer_id"; }
}
