package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/class-sessions", "/api/class-sessions"})
public class ClassSessionsController extends BaseCrudController {
    public ClassSessionsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "class_sessions", "id", List.of("id", "schedule_id", "section_id", "semester_week_id", "session_date", "classroom_id", "lecturer_id", "slot_start_id", "slot_end_id", "start_time", "end_time", "session_type", "practice_group_no", "session_status", "note", "created_at", "updated_at"), false, "cses.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT cses.*, csec.section_code, co.course_code, cr.room_number, l.full_name AS lecturer_name FROM class_sessions cses JOIN class_sections csec ON cses.section_id = csec.id JOIN courses co ON csec.course_id = co.id LEFT JOIN classrooms cr ON cses.classroom_id = cr.id LEFT JOIN lecturers l ON cses.lecturer_id = l.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT cses.*, csec.section_code, co.course_code, cr.room_number, l.full_name AS lecturer_name FROM class_sessions cses JOIN class_sections csec ON cses.section_id = csec.id JOIN courses co ON csec.course_id = co.id LEFT JOIN classrooms cr ON cses.classroom_id = cr.id LEFT JOIN lecturers l ON cses.lecturer_id = l.id"; }

    @Override
    protected String selectWhere() { return "1 = 1"; }

    @Override
    protected String idColumnForPath() { return "cses.id"; }
}
