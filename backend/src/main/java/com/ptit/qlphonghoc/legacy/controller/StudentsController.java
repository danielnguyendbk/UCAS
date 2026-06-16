package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/students", "/api/students"})
public class StudentsController extends BaseCrudController {
    public StudentsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "students", "student_id",
                List.of("student_id", "user_id", "department_id", "student_code", "class_name", "course_year", "phone", "created_at", "updated_at", "is_deleted"),
                true, "st.student_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "student_id", List.of("id"),
                "department_id", List.of("faculty_id"),
                "student_code", List.of("code")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT st.*,
                       st.student_id AS id,
                       st.department_id AS faculty_id,
                       st.student_code AS code,
                       d.department_name,
                       d.department_name AS faculty_name,
                       d.department_code,
                       d.department_code AS faculty_code,
                       u.username,
                       u.email,
                       u.status AS user_status,
                       COALESCE(u.username, st.student_code) AS user_full_name
                FROM students st
                JOIN departments d ON st.department_id = d.department_id
                JOIN users u ON st.user_id = u.user_id
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String selectWhere() { return "st.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "st.student_id"; }
}
