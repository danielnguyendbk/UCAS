package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/lecturers", "/api/lecturers"})
public class LecturersController extends BaseCrudController {
    public LecturersController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "lecturers", "id", List.of("id", "user_id", "department_id", "staff_code", "full_name", "email", "phone", "created_at", "updated_at", "is_deleted"), true, "l.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT l.*, d.name AS department_name, u.username, u.role FROM lecturers l JOIN departments d ON l.department_id = d.id JOIN users u ON l.user_id = u.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT l.*, d.name AS department_name, u.username, u.role FROM lecturers l JOIN departments d ON l.department_id = d.id JOIN users u ON l.user_id = u.id"; }

    @Override
    protected String selectWhere() { return "l.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "l.id"; }
}
