package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/semester-weeks", "/api/semester-weeks"})
public class SemesterWeeksController extends BaseCrudController {
    public SemesterWeeksController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "semester_weeks", "id", List.of("id", "semester_id", "week_no", "start_date", "end_date", "is_break", "note"), false, "id DESC");
    }
}
