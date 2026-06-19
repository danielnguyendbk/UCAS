package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/semesters", "/api/semesters"})
public class SemestersController extends BaseCrudController {
    public SemestersController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "semesters", "semester_id",
                List.of("semester_id", "academic_year_id", "semester_code", "semester_year", "semester_type", "semester_name", "start_date", "end_date", "status", "created_at", "updated_at", "is_deleted"),
                true, "s.start_date DESC, s.semester_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "semester_id", List.of("id"),
                "semester_code", List.of("code"),
                "semester_name", List.of("name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT s.*,
                       s.semester_id AS id,
                       s.semester_code AS code,
                       s.semester_name AS name,
                       ay.year_label AS academic_year_label
                FROM semesters s
                JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String selectWhere() { return "s.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "s.semester_id"; }
}
