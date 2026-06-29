package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/departments", "/api/departments"})
public class DepartmentsController extends BaseCrudController {
    public DepartmentsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "departments", "department_id",
                List.of("department_id", "department_code", "department_name", "created_at", "updated_at", "is_deleted"),
                true, "department_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "department_id", List.of("id", "faculty_id"),
                "department_code", List.of("code", "faculty_code"),
                "department_name", List.of("name", "faculty_name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT department_id,
                       department_id AS id,
                       department_id AS faculty_id,
                       department_code,
                       department_code AS code,
                       department_code AS faculty_code,
                       department_name,
                       department_name AS name,
                       department_name AS faculty_name,
                       created_at,
                       updated_at,
                       is_deleted
                FROM departments
                """;
    }

    @Override
    protected String oneSelectSql() {
        return listSelectSql();
    }
}
