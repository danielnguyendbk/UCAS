package com.ptit.qlphonghoc.admin.controller;

import com.ptit.qlphonghoc.admin.examimport.dto.ExamUpdateRequest;
import com.ptit.qlphonghoc.admin.examworkflow.service.ExamWorkflowService;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/exams")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamController {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ExamWorkflowService service;

    public AdminExamController(NamedParameterJdbcTemplate jdbcTemplate, ExamWorkflowService service) {
        this.jdbcTemplate = jdbcTemplate;
        this.service = service;
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
                l.lecturer_code AS proctorCode,
                l.full_name AS proctorName,
                e.created_at AS createdAt,
                e.updated_at AS updatedAt
            FROM exams e
            JOIN semesters sem ON sem.semester_id = e.semester_id AND sem.is_deleted = FALSE
            JOIN class_sections cs ON cs.section_id = e.section_id
            JOIN courses c ON c.course_id = cs.course_id AND c.is_deleted = FALSE
            JOIN departments d ON d.department_id = c.department_id AND d.is_deleted = FALSE
            LEFT JOIN classrooms cr ON cr.classroom_id = e.classroom_id AND cr.is_deleted = FALSE
            LEFT JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            LEFT JOIN lecturers l ON l.lecturer_id = e.proctor_lecturer_id AND l.is_deleted = FALSE
            WHERE (:semesterId IS NULL OR e.semester_id = :semesterId)
              AND (:status IS NULL OR :status = '' OR e.status = :status)
            ORDER BY e.exam_date ASC, e.start_time ASC, e.exam_id ASC
            """;

        Map<String, Object> params = new HashMap<>();
        params.put("semesterId", semesterId);
        params.put("status", normalize(status));

        return ApiResponse.success("OK", jdbcTemplate.queryForList(sql, params));
    }

    @PostMapping("/approve-all")
    public ApiResponse<Map<String, Integer>> approveAll(
            @RequestParam(required = false) Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        int updated;
        if (semesterId != null) {
            updated = jdbcTemplate.update("""
                    UPDATE exams SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
                    WHERE status NOT IN ('CANCELLED','COMPLETED','PUBLISHED')
                      AND semester_id = :semesterId
                    """, Map.of("semesterId", semesterId));
        } else {
            updated = jdbcTemplate.update("""
                    UPDATE exams SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
                    WHERE status NOT IN ('CANCELLED','COMPLETED','PUBLISHED')
                    """, Map.of());
        }
        return ApiResponse.success("Da cong bo " + updated + " lich thi.", Map.of("approved", updated));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Map<String, Object> exam = findExamOrThrow(id);
        String status = (String) exam.get("status");
        if (Set.of("CANCELLED", "COMPLETED", "PUBLISHED").contains(status)) {
            throw new BadRequestException("INVALID_STATUS", "Khong the cong bo lich thi o trang thai: " + status);
        }
        jdbcTemplate.update(
                "UPDATE exams SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW() WHERE exam_id = :id",
                Map.of("id", id)
        );
        return ApiResponse.success("Da cong bo lich thi.", null);
    }

    @PostMapping("/{id}/reopen")
    public ApiResponse<Void> reopen(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Map<String, Object> exam = findExamOrThrow(id);
        String status = (String) exam.get("status");
        if (!Set.of("PUBLISHED", "CANCELLED").contains(status)) {
            throw new BadRequestException("INVALID_STATUS", "Chi co the mo lai lich thi da cong bo hoac da huy (hien tai: " + status + ")");
        }
        jdbcTemplate.update("""
                UPDATE exams
                SET status = CASE WHEN classroom_id IS NULL THEN 'NEEDS_ROOM' ELSE 'ROOM_ASSIGNED' END,
                    published_at = NULL,
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL,
                    updated_at = NOW()
                WHERE exam_id = :id
                """, Map.of("id", id));
        return ApiResponse.success("Da mo lai lich thi.", null);
    }

    @GetMapping("/{examId}/edit-options")
    public ApiResponse<Map<String, Object>> getEditOptions(
            @PathVariable Long examId,
            @RequestParam(required = false) String examDate,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false) Integer minCapacity
    ) {
        return ApiResponse.success(
                "Tai du lieu chinh sua lich thi thanh cong.",
                service.getEditOptions(examId, examDate, startTime, endTime, minCapacity)
        );
    }

    @GetMapping({"/available-rooms", "/rooms"})
    public ApiResponse<List<Map<String, Object>>> getAvailableRooms(
            @RequestParam(required = false) Long semesterId,
            @RequestParam String examDate,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Long excludeExamId
    ) {
        return ApiResponse.success(
                "Tai danh sach phong thi hop le thanh cong.",
                service.getAvailableRooms(semesterId, examDate, startTime, endTime, minCapacity, excludeExamId)
        );
    }

    @GetMapping({"/available-proctors", "/proctors", "/lecturers"})
    public ApiResponse<List<Map<String, Object>>> getAvailableProctors(
            @RequestParam(required = false) Long semesterId,
            @RequestParam String examDate,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Long excludeExamId
    ) {
        return ApiResponse.success(
                "Tai danh sach giam thi hop le thanh cong.",
                service.getAvailableProctors(semesterId, examDate, startTime, endTime, excludeExamId)
        );
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Map<String, Object> exam = findExamOrThrow(id);
        String status = (String) exam.get("status");
        if ("CANCELLED".equals(status) || "COMPLETED".equals(status)) {
            throw new BadRequestException("INVALID_STATUS", "Khong the huy lich thi o trang thai: " + status);
        }
        jdbcTemplate.update(
                "UPDATE exams SET status = 'CANCELLED', updated_at = NOW() WHERE exam_id = :id",
                Map.of("id", id)
        );
        return ApiResponse.success("Da huy lich thi.", null);
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> updateExam(
            @PathVariable Long id,
            @RequestBody ExamUpdateRequest req
    ) {
        return ApiResponse.success("Da cap nhat lich thi.", service.updateExam(id, req));
    }

    private Map<String, Object> findExamOrThrow(Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT exam_id, status FROM exams WHERE exam_id = :id",
                Map.of("id", id)
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("EXAM_NOT_FOUND", "Khong tim thay lich thi #" + id);
        }
        return rows.get(0);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
