package com.ptit.qlphonghoc.student.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.student.dto.exam.StudentExamItemResponse;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student/exams")
public class StudentExamController {

    private final NamedParameterJdbcTemplate jdbc;

    public StudentExamController(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public ApiResponse<List<StudentExamItemResponse>> getMyExams(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer semesterId
    ) {
        String sql = """
                SELECT
                    e.exam_id         AS examId,
                    c.course_code     AS courseCode,
                    c.course_name     AS courseName,
                    cs.section_code   AS sectionCode,
                    e.exam_date       AS examDate,
                    e.start_time      AS startTime,
                    e.end_time        AS endTime,
                    COALESCE(NULLIF(cr.classroom_code, ''), CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number)) AS classroomCode,
                    COALESCE(cr.classroom_name, cr.room_number) AS classroomName,
                    b.building_code   AS buildingCode,
                    e.exam_type       AS examType,
                    e.exam_method     AS examMethod,
                    e.note
                FROM exams e
                JOIN class_sections cs ON cs.section_id = e.section_id
                JOIN courses c ON c.course_id = cs.course_id AND c.is_deleted = FALSE
                JOIN classrooms cr ON cr.classroom_id = e.classroom_id AND cr.is_deleted = FALSE
                JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
                JOIN student_section_enrollments sse
                    ON sse.section_id = cs.section_id
                   AND sse.student_id = (SELECT student_id FROM students WHERE user_id = :userId LIMIT 1)
                   AND (sse.status IS NULL OR sse.status NOT IN ('DROPPED','CANCELLED'))
                WHERE e.status IN ('ROOM_ASSIGNED','READY_FOR_APPROVAL','PUBLISHED','SCHEDULED')
                  AND (:semesterId IS NULL OR e.semester_id = :semesterId)
                ORDER BY e.exam_date ASC, e.start_time ASC
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userDetails.getUserId());
        params.put("semesterId", semesterId);

        List<StudentExamItemResponse> results = jdbc.query(sql, params, (rs, rowNum) ->
                new StudentExamItemResponse(
                        rs.getLong("examId"),
                        rs.getString("courseCode"),
                        rs.getString("courseName"),
                        rs.getString("sectionCode"),
                        rs.getString("examDate"),
                        rs.getString("startTime"),
                        rs.getString("endTime"),
                        rs.getString("classroomCode"),
                        rs.getString("classroomName"),
                        rs.getString("buildingCode"),
                        rs.getString("examType"),
                        rs.getString("examMethod"),
                        rs.getString("note")
                )
        );

        return ApiResponse.success("OK", results);
    }
}
