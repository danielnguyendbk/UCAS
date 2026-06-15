package com.ptit.qlphonghoc.admin.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/exams")
public class AdminExamController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminExamController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getExams(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) String status
    ) {
        String sql = """
            SELECT
                e.exam_id AS id,
                e.semester_id AS semesterId,
                sem.semester_code AS semesterCode,
                sem.semester_name AS semesterName,
                e.section_id AS sectionId,
                cs.section_code AS sectionCode,
                cs.class_name AS classCodes,
                c.department_id AS departmentId,
                d.department_code AS departmentCode,
                d.department_name AS departmentName,
                c.course_id AS courseId,
                c.course_code AS courseCode,
                c.course_name AS courseName,
                e.exam_type AS examType,
                e.exam_method AS examMethod,
                e.exam_date AS examDate,
                e.start_time AS startTime,
                e.end_time AS endTime,
                e.student_count AS studentCount,
                e.seat_range AS seatRange,
                e.status,
                e.note AS notes,
                cr.classroom_id AS classroomId,
                cr.classroom_code AS roomCode,
                COALESCE(cr.classroom_name, cr.room_number) AS roomName,
                b.building_code AS buildingCode,
                b.building_name AS buildingName,
                l.lecturer_id AS proctorId,
                l.full_name AS proctorName,
                e.created_at AS createdAt,
                e.updated_at AS updatedAt
            FROM exams e
            JOIN semesters sem ON sem.semester_id = e.semester_id AND sem.is_deleted = FALSE
            JOIN class_sections cs ON cs.section_id = e.section_id
            JOIN courses c ON c.course_id = cs.course_id AND c.is_deleted = FALSE
            JOIN departments d ON d.department_id = c.department_id AND d.is_deleted = FALSE
            JOIN classrooms cr ON cr.classroom_id = e.classroom_id AND cr.is_deleted = FALSE
            JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            LEFT JOIN lecturers l ON l.lecturer_id = e.proctor_lecturer_id AND l.is_deleted = FALSE
            WHERE (:semesterId IS NULL OR e.semester_id = :semesterId)
              AND (:status IS NULL OR :status = '' OR e.status = :status)
            ORDER BY e.exam_date ASC, e.start_time ASC, e.exam_id ASC
            """;

        Map<String, Object> params = new HashMap<>();
        params.put("semesterId", semesterId);
        params.put("status", normalize(status));

        List<Map<String, Object>> exams = jdbcTemplate.queryForList(sql, params);
        return ApiResponse.success("OK", exams);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
