package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final JdbcTemplate jdbcTemplate;

    public CategoryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Lấy danh sách Khoa
    @GetMapping("/faculties")
    public ApiResponse<List<Map<String, Object>>> getFaculties() {
        String sql = "SELECT code, name FROM faculties WHERE is_deleted = FALSE";
        List<Map<String, Object>> faculties = jdbcTemplate.queryForList(sql);
        return ApiResponse.success("OK", faculties);
    }

    // Lấy danh sách Bộ môn (kèm theo mã Khoa để Frontend lọc thông minh)
    @GetMapping("/departments")
    public ApiResponse<List<Map<String, Object>>> getDepartments() {
        String sql = """
            SELECT d.code, d.name, f.code as facultyCode 
            FROM departments d 
            JOIN faculties f ON d.faculty_id = f.id 
            WHERE d.is_deleted = FALSE
            """;
        List<Map<String, Object>> departments = jdbcTemplate.queryForList(sql);
        return ApiResponse.success("OK", departments);
    }
    // Lấy danh sách Học kỳ
    @GetMapping("/semesters")
    public ApiResponse<List<Map<String, Object>>> getSemesters() {
        String sql = "SELECT id, semester_name as name FROM semesters WHERE is_deleted = FALSE";
        return ApiResponse.success("OK", jdbcTemplate.queryForList(sql));
    }

    // Lấy danh sách Môn học (Kèm departmentCode để lọc)
    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getCourses() {
        String sql = "SELECT c.id, c.course_name as name, d.code as departmentCode FROM courses c JOIN departments d ON c.department_id = d.id WHERE c.is_deleted = FALSE";
        return ApiResponse.success("OK", jdbcTemplate.queryForList(sql));
    }

    // Lấy danh sách Giảng viên (Kèm departmentCode để lọc)
    @GetMapping("/lecturers")
    public ApiResponse<List<Map<String, Object>>> getLecturers() {
        String sql = "SELECT l.id, l.full_name as name, d.code as departmentCode FROM lecturers l JOIN departments d ON l.department_id = d.id WHERE l.is_deleted = FALSE";
        return ApiResponse.success("OK", jdbcTemplate.queryForList(sql));
    }
}