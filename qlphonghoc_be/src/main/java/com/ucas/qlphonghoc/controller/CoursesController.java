package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/courses", "/api/courses"})
public class CoursesController extends BaseCrudController {
    public CoursesController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "courses", "id", List.of("id", "department_id", "course_code", "course_name", "credits", "required_room_type", "description", "created_at", "updated_at", "is_deleted"), true, "c.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT c.*, d.name AS department_name, d.code AS department_code FROM courses c JOIN departments d ON c.department_id = d.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT c.*, d.name AS department_name, d.code AS department_code FROM courses c JOIN departments d ON c.department_id = d.id"; }

    @Override
    protected String selectWhere() { return "c.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "c.id"; }
}
