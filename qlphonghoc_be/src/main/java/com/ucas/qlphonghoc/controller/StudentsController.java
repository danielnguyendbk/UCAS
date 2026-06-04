package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/students", "/api/students"})
public class StudentsController extends BaseCrudController {
    public StudentsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "students", "id", List.of("id", "user_id", "faculty_id", "student_code", "class_name", "course_year", "phone", "created_at", "updated_at", "is_deleted"), true, "st.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT st.*, f.name AS faculty_name, u.username, u.email, u.full_name AS user_full_name FROM students st JOIN faculties f ON st.faculty_id = f.id JOIN users u ON st.user_id = u.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT st.*, f.name AS faculty_name, u.username, u.email, u.full_name AS user_full_name FROM students st JOIN faculties f ON st.faculty_id = f.id JOIN users u ON st.user_id = u.id"; }

    @Override
    protected String selectWhere() { return "st.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "st.id"; }
}
