package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/student-section-enrollments", "/api/student-section-enrollments"})
public class StudentSectionEnrollmentsController extends BaseCrudController {
    public StudentSectionEnrollmentsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "student_section_enrollments", "id", List.of("id", "student_id", "section_id", "status", "enrolled_at"), false, "id DESC");
    }
}
