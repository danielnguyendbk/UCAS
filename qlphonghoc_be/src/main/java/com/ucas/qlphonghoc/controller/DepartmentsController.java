package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/departments", "/api/departments"})
public class DepartmentsController extends BaseCrudController {
    public DepartmentsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "departments", "id", List.of("id", "faculty_id", "name", "code", "created_at", "updated_at", "is_deleted"), true, "d.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT d.*, f.name AS faculty_name, f.code AS faculty_code FROM departments d JOIN faculties f ON d.faculty_id = f.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT d.*, f.name AS faculty_name, f.code AS faculty_code FROM departments d JOIN faculties f ON d.faculty_id = f.id"; }

    @Override
    protected String selectWhere() { return "d.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "d.id"; }
}
