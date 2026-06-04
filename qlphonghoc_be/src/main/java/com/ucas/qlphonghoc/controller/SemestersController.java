package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/semesters", "/api/semesters"})
public class SemestersController extends BaseCrudController {
    public SemestersController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "semesters", "id", List.of("id", "academic_year_id", "semester_type", "semester_name", "start_date", "end_date", "status", "created_at", "updated_at", "is_deleted"), true, "s.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT s.*, ay.year_label AS academic_year_label FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT s.*, ay.year_label AS academic_year_label FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id"; }

    @Override
    protected String selectWhere() { return "s.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "s.id"; }
}
