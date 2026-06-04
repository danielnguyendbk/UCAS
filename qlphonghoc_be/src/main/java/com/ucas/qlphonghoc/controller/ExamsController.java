package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/exams", "/api/exams"})
public class ExamsController extends BaseCrudController {
    public ExamsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "exams", "id", List.of("id", "semester_id", "section_id", "classroom_id", "proctor_lecturer_id", "exam_type", "exam_method", "exam_date", "start_time", "end_time", "student_count", "seat_range", "status", "note", "created_at", "updated_at"), false, "e.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT e.*, co.course_code, co.course_name, cr.room_number, l.full_name AS proctor_name FROM exams e JOIN class_sections cs ON e.section_id = cs.id JOIN courses co ON cs.course_id = co.id JOIN classrooms cr ON e.classroom_id = cr.id LEFT JOIN lecturers l ON e.proctor_lecturer_id = l.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT e.*, co.course_code, co.course_name, cr.room_number, l.full_name AS proctor_name FROM exams e JOIN class_sections cs ON e.section_id = cs.id JOIN courses co ON cs.course_id = co.id JOIN classrooms cr ON e.classroom_id = cr.id LEFT JOIN lecturers l ON e.proctor_lecturer_id = l.id"; }

    @Override
    protected String selectWhere() { return "1 = 1"; }

    @Override
    protected String idColumnForPath() { return "e.id"; }
}
