package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/class-sections", "/api/class-sections"})
public class ClassSectionsController extends BaseCrudController {
    public ClassSectionsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "class_sections", "id", List.of("id", "semester_id", "course_id", "lecturer_id", "section_code", "enrolled_count", "max_capacity", "status", "created_at", "updated_at"), false, "cs.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT cs.*, s.semester_name, co.course_code, co.course_name, l.full_name AS lecturer_name FROM class_sections cs JOIN semesters s ON cs.semester_id = s.id JOIN courses co ON cs.course_id = co.id JOIN lecturers l ON cs.lecturer_id = l.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT cs.*, s.semester_name, co.course_code, co.course_name, l.full_name AS lecturer_name FROM class_sections cs JOIN semesters s ON cs.semester_id = s.id JOIN courses co ON cs.course_id = co.id JOIN lecturers l ON cs.lecturer_id = l.id"; }

    @Override
    protected String selectWhere() { return "1 = 1"; }

    @Override
    protected String idColumnForPath() { return "cs.id"; }
}
