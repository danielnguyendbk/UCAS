package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/courses", "/api/courses"})
public class CoursesController extends BaseCrudController {
    public CoursesController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "courses", "course_id",
                List.of("course_id", "department_id", "course_code", "course_name", "credits", "course_type", "required_room_type", "is_active", "description", "created_at", "updated_at", "is_deleted"),
                true, "c.course_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "course_id", List.of("id"),
                "course_code", List.of("code"),
                "course_name", List.of("name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT c.*,
                       c.course_id AS id,
                       c.course_code AS code,
                       c.course_name AS name,
                       d.department_name,
                       d.department_code
                FROM courses c
                JOIN departments d ON c.department_id = d.department_id
                """;
    }

    @Override
    protected String oneSelectSql() {
        return listSelectSql();
    }

    @Override
    protected String selectWhere() { return "c.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "c.course_id"; }
}
