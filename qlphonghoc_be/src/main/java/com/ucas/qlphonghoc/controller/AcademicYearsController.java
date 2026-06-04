package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/academic-years", "/api/academic-years"})
public class AcademicYearsController extends BaseCrudController {
    public AcademicYearsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "academic_years", "id", List.of("id", "year_label", "start_date", "end_date", "is_current", "created_at", "updated_at", "is_deleted"), true, "id DESC");
    }
}
