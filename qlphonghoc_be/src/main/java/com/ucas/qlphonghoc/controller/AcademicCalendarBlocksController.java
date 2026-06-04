package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/academic-calendar-blocks", "/api/academic-calendar-blocks"})
public class AcademicCalendarBlocksController extends BaseCrudController {
    public AcademicCalendarBlocksController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "academic_calendar_blocks", "id", List.of("id", "semester_id", "start_date", "end_date", "block_type", "title", "is_teaching_allowed", "note", "created_at", "updated_at"), false, "id DESC");
    }
}
