package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.admin.examworkflow.dto.ExamWorkflowStatusSummary;
import com.ptit.qlphonghoc.admin.examworkflow.service.ExamWorkflowService;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Time;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class StaffExamAllocationService {

    private static final List<String> ACTIVE_EXAM_STATUSES = List.of(
            "DRAFT", "NEEDS_ROOM", "ROOM_ASSIGNED", "CONFLICT", "READY_FOR_APPROVAL", "PUBLISHED", "SCHEDULED"
    );

    private final NamedParameterJdbcTemplate jdbc;
    private final ExamWorkflowService examWorkflowService;

    public StaffExamAllocationService(NamedParameterJdbcTemplate jdbc, ExamWorkflowService examWorkflowService) {
        this.jdbc = jdbc;
        this.examWorkflowService = examWorkflowService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllocations(Long semesterId, String status) {
        Map<String, Object> params = new HashMap<>();
        StringBuilder sql = new StringBuilder("""
                SELECT
                    e.exam_id AS examId,
                    e.exam_id AS id,
                    e.semester_id AS semesterId,
                    e.section_id AS sectionId,
                    e.classroom_id AS classroomId,
                    e.exam_date AS examDate,
                    e.start_time AS startTime,
                    e.end_time AS endTime,
                    e.exam_type AS examType,
                    e.exam_method AS examMethod,
                    e.status AS status,
                    e.validation_status AS validationStatus,
                    e.conflict_reason AS conflictReason,
                    e.note AS note,
                    e.proctor_lecturer_id AS proctorId,
                    e.student_count AS studentCount,
                    COALESCE(enr.enrolledCount, e.student_count, 0) AS enrolledCount,
                    CASE
                        WHEN e.student_count IS NOT NULL
                         AND enr.enrolledCount IS NOT NULL
                         AND e.student_count <> enr.enrolledCount
                        THEN TRUE ELSE FALSE
                    END AS studentCountMismatch,
                    c.course_id AS courseId,
                    c.course_code AS courseCode,
                    c.course_name AS courseName,
                    cs.section_code AS sectionCode,
                    CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode,
                    CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS classroomCode,
                    cr.classroom_name AS roomName,
                    b.building_id AS buildingId,
                    b.building_code AS buildingCode,
                    b.building_name AS buildingName,
                    l.lecturer_code AS proctorCode,
                    l.full_name AS proctorName
                FROM exams e
                JOIN class_sections cs ON cs.section_id = e.section_id
                JOIN courses c ON c.course_id = cs.course_id
                LEFT JOIN classrooms cr ON cr.classroom_id = e.classroom_id
                LEFT JOIN buildings b ON b.building_id = cr.building_id
                LEFT JOIN lecturers l ON l.lecturer_id = e.proctor_lecturer_id
                LEFT JOIN (
                    SELECT section_id, COUNT(DISTINCT student_id) AS enrolledCount
                    FROM student_section_enrollments
                    WHERE status IS NULL OR status NOT IN ('DROPPED','CANCELLED')
                    GROUP BY section_id
                ) enr ON enr.section_id = e.section_id
                WHERE e.status NOT IN ('CANCELLED')
                """);

        if (semesterId != null) {
            sql.append(" AND e.semester_id = :semesterId");
            params.put("semesterId", semesterId);
        }
        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            sql.append(" AND e.status = :status");
            params.put("status", status.toUpperCase(Locale.ROOT));
        }

        sql.append(" ORDER BY e.exam_date IS NULL, e.exam_date, e.start_time, c.course_code, cs.section_code");
        return jdbc.queryForList(sql.toString(), params);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConflicts(Long semesterId, String conflictType) {
        if (semesterId == null) {
            throw new BadRequestException("SEMESTER_REQUIRED", "Vui lòng chọn học kỳ.");
        }
        Map<String, Object> params = new HashMap<>();
        params.put("semesterId", semesterId);

        StringBuilder sql = new StringBuilder("""
                SELECT
                    e.exam_id AS examId,
                    e.exam_id AS id,
                    CASE
                        WHEN e.classroom_id IS NULL THEN 'MISSING_ROOM'
                        WHEN e.conflict_reason LIKE '%sức chứa%' OR e.conflict_reason LIKE '%không đủ%' THEN 'CAPACITY_EXCEEDED'
                        WHEN e.conflict_reason LIKE '%giám thị%' THEN 'PROCTOR_TIME_CONFLICT'
                        WHEN e.conflict_reason LIKE '%lịch học%' THEN 'ROOM_CLASS_CONFLICT'
                        WHEN e.conflict_reason LIKE '%mượn phòng%' THEN 'ROOM_BORROW_CONFLICT'
                        WHEN e.conflict_reason LIKE '%sinh viên%' THEN 'STUDENT_EXAM_CONFLICT'
                        WHEN e.conflict_reason LIKE '%nghỉ%' OR e.conflict_reason LIKE '%HOLIDAY%' THEN 'CALENDAR_BLOCK_CONFLICT'
                        WHEN e.conflict_reason LIKE '%giờ%' OR e.conflict_reason LIKE '%thời gian%' THEN 'INVALID_EXAM_TIME'
                        WHEN e.conflict_reason LIKE '%phòng%' THEN 'ROOM_EXAM_CONFLICT'
                        ELSE 'CONFLICT'
                    END AS conflictType,
                    COALESCE(e.conflict_reason, 'Cần kiểm tra lại ca thi này.') AS description,
                    c.course_code AS courseCode,
                    c.course_name AS courseName,
                    cs.section_code AS sectionCode,
                    e.exam_date AS examDate,
                    e.start_time AS startTime,
                    e.end_time AS endTime,
                    CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode,
                    e.status AS status,
                    e.validation_status AS validationStatus,
                    e.note AS note
                FROM exams e
                JOIN class_sections cs ON cs.section_id = e.section_id
                JOIN courses c ON c.course_id = cs.course_id
                LEFT JOIN classrooms cr ON cr.classroom_id = e.classroom_id
                LEFT JOIN buildings b ON b.building_id = cr.building_id
                WHERE e.semester_id = :semesterId
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND (
                      e.classroom_id IS NULL
                      OR e.status = 'CONFLICT'
                      OR e.validation_status = 'CONFLICT'
                      OR e.conflict_reason IS NOT NULL
                  )
                """);

        if (conflictType != null && !conflictType.isBlank() && !"ALL".equalsIgnoreCase(conflictType)) {
            sql.append(" HAVING conflictType = :conflictType");
            params.put("conflictType", conflictType.toUpperCase(Locale.ROOT));
        }

        sql.append(" ORDER BY e.exam_date IS NULL, e.exam_date, e.start_time, c.course_code, cs.section_code");
        return jdbc.queryForList(sql.toString(), params);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWorkflowStatus(Long semesterId) {
        if (semesterId == null) {
            throw new BadRequestException("SEMESTER_REQUIRED", "Vui lòng chọn học kỳ.");
        }
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT
                    s.semester_id AS semesterId,
                    s.semester_name AS semesterName,
                    s.exam_workflow_status AS examWorkflowStatus,
                    s.exam_workflow_status AS status,
                    COUNT(e.exam_id) AS totalExams,
                    SUM(CASE WHEN e.classroom_id IS NULL THEN 1 ELSE 0 END) AS missingRoomCount,
                    SUM(CASE WHEN e.validation_status = 'VALID' THEN 1 ELSE 0 END) AS validCount,
                    SUM(CASE WHEN e.validation_status = 'CONFLICT' OR e.status = 'CONFLICT' THEN 1 ELSE 0 END) AS conflictCount,
                    SUM(CASE WHEN e.status = 'ROOM_ASSIGNED' THEN 1 ELSE 0 END) AS assignedCount,
                    SUM(CASE WHEN e.status = 'READY_FOR_APPROVAL' THEN 1 ELSE 0 END) AS readyForApprovalCount,
                    SUM(CASE WHEN e.status IN ('PUBLISHED','SCHEDULED') THEN 1 ELSE 0 END) AS publishedCount
                FROM semesters s
                LEFT JOIN exams e ON e.semester_id = s.semester_id
                    AND e.status NOT IN ('CANCELLED','COMPLETED')
                WHERE s.semester_id = :semesterId
                  AND s.is_deleted = FALSE
                GROUP BY s.semester_id, s.semester_name, s.exam_workflow_status
                """, Map.of("semesterId", semesterId));

        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Không tìm thấy học kỳ.");
        }
        return rows.get(0);
    }

    @Transactional
    public Map<String, Object> autoAssign(Long semesterId) {
        if (semesterId == null) {
            throw new BadRequestException("SEMESTER_REQUIRED", "Vui lòng chọn học kỳ.");
        }
        ensureEditableSemester(semesterId);
        syncStudentCounts(semesterId);

        List<Map<String, Object>> examsToAssign = jdbc.queryForList("""
                SELECT
                    e.exam_id AS examId,
                    e.exam_date AS examDate,
                    e.start_time AS startTime,
                    e.end_time AS endTime,
                    COALESCE(e.student_count, 0) AS studentCount
                FROM exams e
                WHERE e.semester_id = :semesterId
                  AND e.status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED')
                  AND (e.classroom_id IS NULL OR e.status IN ('DRAFT','NEEDS_ROOM','CONFLICT'))
                  AND e.exam_date IS NOT NULL
                  AND e.start_time IS NOT NULL
                  AND e.end_time IS NOT NULL
                  AND e.end_time > e.start_time
                ORDER BY e.student_count DESC, e.exam_date, e.start_time
                """, Map.of("semesterId", semesterId));

        List<Map<String, Object>> rooms = jdbc.queryForList("""
                SELECT classroom_id AS classroomId, capacity
                FROM classrooms
                WHERE is_deleted = FALSE
                  AND is_active = TRUE
                ORDER BY capacity ASC, classroom_id ASC
                """, Map.of());

        int assigned = 0;
        int skipped = 0;

        for (Map<String, Object> exam : examsToAssign) {
            Long examId = toLong(exam.get("examId"));
            Date examDate = (Date) exam.get("examDate");
            Time startTime = (Time) exam.get("startTime");
            Time endTime = (Time) exam.get("endTime");
            int studentCount = toInt(exam.get("studentCount"));

            Long selectedRoomId = null;
            for (Map<String, Object> room : rooms) {
                Long roomId = toLong(room.get("classroomId"));
                int capacity = toInt(room.get("capacity"));
                if (capacity < studentCount) continue;
                if (isRoomAvailable(roomId, examId, examDate, startTime, endTime)) {
                    selectedRoomId = roomId;
                    break;
                }
            }

            if (selectedRoomId == null) {
                skipped++;
                markExamConflict(examId, "Chưa tìm được phòng thi phù hợp");
                continue;
            }

            jdbc.update("""
                    UPDATE exams
                    SET classroom_id = :roomId,
                        status = 'ROOM_ASSIGNED',
                        validation_status = 'NOT_CHECKED',
                        conflict_reason = NULL
                    WHERE exam_id = :examId
                    """, Map.of("roomId", selectedRoomId, "examId", examId));
            assigned++;
        }

        jdbc.update("""
                UPDATE exams
                SET status = 'NEEDS_ROOM'
                WHERE semester_id = :semesterId
                  AND classroom_id IS NULL
                  AND status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED')
                """, Map.of("semesterId", semesterId));

        jdbc.update("UPDATE semesters SET exam_workflow_status = 'DRAFT' WHERE semester_id = :semesterId", Map.of("semesterId", semesterId));

        return Map.of(
                "message", "Đã chạy phân phòng thi tự động.",
                "assigned", assigned,
                "skipped", skipped,
                "semesterId", semesterId
        );
    }

    @Transactional
    public Map<String, Object> validate(Long semesterId) {
        if (semesterId == null) {
            throw new BadRequestException("SEMESTER_REQUIRED", "Vui lòng chọn học kỳ.");
        }
        syncStudentCounts(semesterId);
        ExamWorkflowStatusSummary summary = examWorkflowService.validate(semesterId, null);
        syncExamStatusesAfterValidation(semesterId);
        return Map.of(
                "semesterId", summary.semesterId(),
                "semesterName", summary.semesterName(),
                "examWorkflowStatus", summary.examWorkflowStatus(),
                "status", summary.examWorkflowStatus(),
                "totalExams", summary.totalExams(),
                "validCount", summary.validCount(),
                "conflictCount", summary.conflictCount(),
                "draftCount", summary.draftCount(),
                "publishedCount", summary.publishedCount()
        );
    }

    @Transactional
    public Map<String, Object> submitForApproval(Long semesterId) {
        if (semesterId == null) {
            throw new BadRequestException("SEMESTER_REQUIRED", "Vui lòng chọn học kỳ.");
        }
        ensureEditableSemester(semesterId);
        Map<String, Object> validation = validate(semesterId);
        int conflictCount = toInt(validation.get("conflictCount"));
        int missingRoomCount = countMissingRooms(semesterId);
        int total = toInt(validation.get("totalExams"));

        if (total == 0) {
            throw new BadRequestException("NO_EXAMS", "Không có ca thi để gửi duyệt.");
        }
        if (missingRoomCount > 0) {
            throw new BadRequestException("MISSING_ROOM", "Còn " + missingRoomCount + " ca thi chưa phân phòng.");
        }
        if (conflictCount > 0) {
            throw new BadRequestException("EXAM_CONFLICTS", "Còn " + conflictCount + " xung đột lịch thi.");
        }

        jdbc.update("""
                UPDATE exams
                SET status = 'READY_FOR_APPROVAL'
                WHERE semester_id = :semesterId
                  AND status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED')
                  AND validation_status = 'VALID'
                  AND classroom_id IS NOT NULL
                """, Map.of("semesterId", semesterId));
        jdbc.update("UPDATE semesters SET exam_workflow_status = 'READY_FOR_APPROVAL' WHERE semester_id = :semesterId", Map.of("semesterId", semesterId));

        Map<String, Object> workflow = getWorkflowStatus(semesterId);
        return Map.of(
                "message", "Đã gửi lịch thi cho Admin duyệt/công bố.",
                "workflow", workflow,
                "semesterId", semesterId
        );
    }

    @Transactional
    public Map<String, Object> assignRoom(Long examId, String classroomCode) {
        if (examId == null) {
            throw new BadRequestException("EXAM_REQUIRED", "Không tìm thấy ca thi.");
        }
        if (classroomCode == null || classroomCode.trim().isEmpty()) {
            throw new BadRequestException("ROOM_REQUIRED", "Vui lòng nhập mã phòng thi.");
        }

        Map<String, Object> exam = findExamForUpdate(examId);
        Long semesterId = toLong(exam.get("semesterId"));
        ensureEditableSemester(semesterId);

        Map<String, Object> room = findRoomByCode(classroomCode.trim());
        Long roomId = toLong(room.get("classroomId"));
        int capacity = toInt(room.get("capacity"));
        int studentCount = toInt(exam.get("studentCount"));

        Date examDate = (Date) exam.get("examDate");
        Time startTime = (Time) exam.get("startTime");
        Time endTime = (Time) exam.get("endTime");

        if (examDate == null || startTime == null || endTime == null || !endTime.after(startTime)) {
            throw new BadRequestException("INVALID_EXAM_TIME", "Ngày/giờ thi không hợp lệ, không thể phân phòng.");
        }
        if (capacity < studentCount) {
            throw new BadRequestException("CAPACITY_EXCEEDED", "Phòng thi không đủ sức chứa.");
        }
        if (!isRoomAvailable(roomId, examId, examDate, startTime, endTime)) {
            throw new BadRequestException("ROOM_CONFLICT", "Phòng đã có lịch sử dụng trong thời gian này.");
        }

        jdbc.update("""
                UPDATE exams
                SET classroom_id = :roomId,
                    status = 'ROOM_ASSIGNED',
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL
                WHERE exam_id = :examId
                """, Map.of("roomId", roomId, "examId", examId));
        jdbc.update("UPDATE semesters SET exam_workflow_status = 'DRAFT' WHERE semester_id = :semesterId AND exam_workflow_status IN ('CONFLICT','READY_FOR_APPROVAL')", Map.of("semesterId", semesterId));

        return Map.of(
                "message", "Đã cập nhật phòng thi.",
                "examId", examId,
                "classroomId", roomId,
                "classroomCode", room.get("roomCode")
        );
    }

    private void syncStudentCounts(Long semesterId) {
        jdbc.update("""
                UPDATE exams e
                LEFT JOIN (
                    SELECT section_id, COUNT(DISTINCT student_id) AS enrolledCount
                    FROM student_section_enrollments
                    WHERE status IS NULL OR status NOT IN ('DROPPED','CANCELLED')
                    GROUP BY section_id
                ) enr ON enr.section_id = e.section_id
                SET e.student_count = COALESCE(enr.enrolledCount, e.student_count, 0)
                WHERE e.semester_id = :semesterId
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                """, Map.of("semesterId", semesterId));
    }

    private void syncExamStatusesAfterValidation(Long semesterId) {
        jdbc.update("""
                UPDATE exams
                SET status = 'CONFLICT'
                WHERE semester_id = :semesterId
                  AND status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED')
                  AND validation_status = 'CONFLICT'
                """, Map.of("semesterId", semesterId));
        jdbc.update("""
                UPDATE exams
                SET status = 'ROOM_ASSIGNED'
                WHERE semester_id = :semesterId
                  AND status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED','READY_FOR_APPROVAL')
                  AND validation_status = 'VALID'
                  AND classroom_id IS NOT NULL
                """, Map.of("semesterId", semesterId));
        jdbc.update("""
                UPDATE exams
                SET status = 'NEEDS_ROOM'
                WHERE semester_id = :semesterId
                  AND status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED')
                  AND classroom_id IS NULL
                """, Map.of("semesterId", semesterId));
    }

    private void ensureEditableSemester(Long semesterId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT exam_workflow_status
                FROM semesters
                WHERE semester_id = :semesterId AND is_deleted = FALSE
                """, Map.of("semesterId", semesterId));
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Không tìm thấy học kỳ.");
        }
        String status = String.valueOf(rows.get(0).get("exam_workflow_status"));
        if ("PUBLISHED".equals(status) || "LOCKED".equals(status)) {
            throw new BadRequestException("EXAM_TIMETABLE_READ_ONLY", "Lịch thi đã công bố/đã khóa, không thể phân phòng.");
        }
    }

    private Map<String, Object> findExamForUpdate(Long examId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT
                    e.exam_id AS examId,
                    e.semester_id AS semesterId,
                    e.exam_date AS examDate,
                    e.start_time AS startTime,
                    e.end_time AS endTime,
                    COALESCE(e.student_count, enr.enrolledCount, 0) AS studentCount,
                    e.status AS status
                FROM exams e
                LEFT JOIN (
                    SELECT section_id, COUNT(DISTINCT student_id) AS enrolledCount
                    FROM student_section_enrollments
                    WHERE status IS NULL OR status NOT IN ('DROPPED','CANCELLED')
                    GROUP BY section_id
                ) enr ON enr.section_id = e.section_id
                WHERE e.exam_id = :examId
                  AND e.status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED')
                FOR UPDATE
                """, Map.of("examId", examId));
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("EXAM_NOT_FOUND", "Không tìm thấy ca thi hoặc ca thi không còn được chỉnh sửa.");
        }
        return rows.get(0);
    }

    private Map<String, Object> findRoomByCode(String classroomCode) {
        String normalized = classroomCode.toUpperCase(Locale.ROOT).replace(" ", "");
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT
                    cr.classroom_id AS classroomId,
                    cr.capacity AS capacity,
                    CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode
                FROM classrooms cr
                LEFT JOIN buildings b ON b.building_id = cr.building_id
                WHERE cr.is_deleted = FALSE
                  AND cr.is_active = TRUE
                  AND (
                      UPPER(REPLACE(cr.room_number, ' ', '')) = :code
                      OR UPPER(REPLACE(cr.classroom_name, ' ', '')) = :code
                      OR UPPER(REPLACE(CONCAT(COALESCE(b.building_code, ''), '-', cr.room_number), ' ', '')) = :code
                      OR UPPER(REPLACE(CONCAT(COALESCE(b.building_code, ''), cr.room_number), ' ', '')) = :code
                  )
                ORDER BY cr.capacity ASC
                LIMIT 1
                """, Map.of("code", normalized));
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("CLASSROOM_NOT_FOUND", "Không tìm thấy phòng thi đang hoạt động.");
        }
        return rows.get(0);
    }

    private boolean isRoomAvailable(Long roomId, Long currentExamId, Date examDate, Time startTime, Time endTime) {
        Map<String, Object> params = Map.of(
                "roomId", roomId,
                "examId", currentExamId,
                "examDate", examDate,
                "startTime", startTime,
                "endTime", endTime
        );

        Integer examConflicts = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM exams e
            WHERE e.classroom_id = :roomId
              AND e.exam_id <> :examId
              AND e.exam_date = :examDate
              AND e.status NOT IN ('CANCELLED','COMPLETED')
              AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
            """, params, Integer.class);
        if (examConflicts != null && examConflicts > 0) return false;

        Integer sessionConflicts = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM class_sessions cs
            WHERE cs.classroom_id = :roomId
              AND cs.session_date = :examDate
              AND cs.session_status NOT IN ('CANCELLED')
              AND NOT (cs.end_time <= :startTime OR cs.start_time >= :endTime)
            """, params, Integer.class);
        if (sessionConflicts != null && sessionConflicts > 0) return false;

        Integer borrowConflicts = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM room_borrow_requests r
            WHERE r.approved_classroom_id = :roomId
              AND r.booking_date = :examDate
              AND r.status = 'APPROVED'
              AND NOT (r.end_time <= :startTime OR r.start_time >= :endTime)
            """, params, Integer.class);

        return borrowConflicts == null || borrowConflicts == 0;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableRooms(
            Long semesterId, String examDate, String startTime, String endTime,
            Integer minCapacity, Long excludeExamId) {
        if (examDate == null || startTime == null || endTime == null) {
            throw new BadRequestException("PARAMS_REQUIRED", "Cần cung cấp ngày và giờ thi để tìm phòng trống.");
        }
        Map<String, Object> params = new HashMap<>();
        params.put("examDate", examDate);
        params.put("startTime", startTime);
        params.put("endTime", endTime);
        params.put("minCapacity", minCapacity);
        params.put("excludeExamId", excludeExamId != null ? excludeExamId : -1L);

        return jdbc.queryForList("""
                SELECT
                    cr.classroom_id AS classroomId,
                    cr.room_number AS roomNumber,
                    cr.classroom_name AS roomName,
                    cr.capacity AS capacity,
                    CONCAT(COALESCE(b.building_code,''), IF(b.building_code IS NULL,'','-'), cr.room_number) AS roomCode,
                    b.building_id AS buildingId,
                    b.building_code AS buildingCode,
                    b.building_name AS buildingName
                FROM classrooms cr
                LEFT JOIN buildings b ON b.building_id = cr.building_id
                WHERE cr.is_deleted = FALSE
                  AND cr.is_active = TRUE
                  AND (:minCapacity IS NULL OR cr.capacity >= :minCapacity)
                  AND NOT EXISTS (
                      SELECT 1 FROM exams e
                      WHERE e.classroom_id = cr.classroom_id
                        AND e.exam_date = :examDate
                        AND e.exam_id <> :excludeExamId
                        AND e.status NOT IN ('CANCELLED','COMPLETED')
                        AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
                  )
                  AND NOT EXISTS (
                      SELECT 1 FROM class_sessions cs
                      WHERE cs.classroom_id = cr.classroom_id
                        AND cs.session_date = :examDate
                        AND cs.session_status NOT IN ('CANCELLED')
                        AND NOT (cs.end_time <= :startTime OR cs.start_time >= :endTime)
                  )
                  AND NOT EXISTS (
                      SELECT 1 FROM room_borrow_requests rbr
                      WHERE rbr.approved_classroom_id = cr.classroom_id
                      AND rbr.booking_date = :examDate
                      AND rbr.status = 'APPROVED'
                        AND NOT (rbr.end_time <= :startTime OR rbr.start_time >= :endTime)
                  )
                ORDER BY b.building_code, cr.room_number
                """, params);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClassroomSchedule(Long semesterId) {
        if (semesterId == null) {
            throw new BadRequestException("SEMESTER_REQUIRED", "Vui lòng chọn học kỳ.");
        }
        return jdbc.queryForList("""
                SELECT
                    e.exam_id AS examId,
                    e.classroom_id AS classroomId,
                    cr.room_number AS roomNumber,
                    cr.classroom_name AS roomName,
                    cr.capacity AS capacity,
                    CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode,
                    b.building_id AS buildingId,
                    b.building_code AS buildingCode,
                    b.building_name AS buildingName,
                    c.course_code AS courseCode,
                    c.course_name AS courseName,
                    cs.section_code AS sectionCode,
                    e.exam_date AS examDate,
                    e.start_time AS startTime,
                    e.end_time AS endTime,
                    e.exam_type AS examType,
                    e.exam_method AS examMethod,
                    COALESCE(enr.enrolledCount, e.student_count, 0) AS studentCount,
                    e.status AS status,
                    e.validation_status AS validationStatus,
                    e.conflict_reason AS conflictReason,
                    l.lecturer_code AS proctorCode,
                    l.full_name AS proctorName
                FROM exams e
                JOIN class_sections cs ON cs.section_id = e.section_id
                JOIN courses c ON c.course_id = cs.course_id
                JOIN classrooms cr ON cr.classroom_id = e.classroom_id
                LEFT JOIN buildings b ON b.building_id = cr.building_id
                LEFT JOIN lecturers l ON l.lecturer_id = e.proctor_lecturer_id AND l.is_deleted = FALSE
                LEFT JOIN (
                    SELECT section_id, COUNT(DISTINCT student_id) AS enrolledCount
                    FROM student_section_enrollments
                    WHERE status IS NULL OR status NOT IN ('DROPPED','CANCELLED')
                    GROUP BY section_id
                ) enr ON enr.section_id = e.section_id
                WHERE e.semester_id = :semesterId
                  AND e.status NOT IN ('CANCELLED')
                  AND e.classroom_id IS NOT NULL
                ORDER BY b.building_code, cr.room_number, e.exam_date, e.start_time
                """, Map.of("semesterId", semesterId));
    }

    private int countMissingRooms(Long semesterId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM exams
                WHERE semester_id = :semesterId
                  AND status NOT IN ('CANCELLED','COMPLETED')
                  AND classroom_id IS NULL
                """, Map.of("semesterId", semesterId), Integer.class);
        return count == null ? 0 : count;
    }

    private void markExamConflict(Long examId, String reason) {
        jdbc.update("""
                UPDATE exams
                SET status = 'CONFLICT',
                    validation_status = 'CONFLICT',
                    conflict_reason = :reason
                WHERE exam_id = :examId
                """, Map.of("examId", examId, "reason", reason));
    }

    private static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(String.valueOf(value));
    }

    private static int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number number) return number.intValue();
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? 0 : Integer.parseInt(text);
    }


    @Transactional(readOnly = true)
    public Map<String, Object> getEditOptions(Long examId) {
        if (examId == null) {
            throw new BadRequestException("EXAM_REQUIRED", "Không tìm thấy ca thi.");
        }

        Map<String, Object> exam = findExamDetail(examId);

        Long semesterId = toLong(exam.get("semesterId"));
        Date examDate = (Date) exam.get("examDate");
        Time startTime = (Time) exam.get("startTime");
        Time endTime = (Time) exam.get("endTime");
        int studentCount = toInt(exam.get("studentCount"));

        List<Map<String, Object>> rooms = getAvailableRooms(
                semesterId,
                examDate == null ? null : examDate.toString(),
                startTime == null ? null : startTime.toString(),
                endTime == null ? null : endTime.toString(),
                studentCount,
                examId
        );

        List<Map<String, Object>> proctors = getAvailableProctors(
                semesterId,
                examDate,
                startTime,
                endTime,
                examId
        );

        return Map.of(
                "exam", exam,
                "availableRooms", rooms,
                "availableProctors", proctors
        );
    }

    private Map<String, Object> findExamDetail(Long examId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT
                e.exam_id AS examId,
                e.semester_id AS semesterId,
                e.section_id AS sectionId,
                e.classroom_id AS classroomId,
                e.proctor_lecturer_id AS proctorLecturerId,
                e.exam_date AS examDate,
                e.start_time AS startTime,
                e.end_time AS endTime,
                e.exam_type AS examType,
                e.exam_method AS examMethod,
                e.status AS status,
                e.validation_status AS validationStatus,
                e.conflict_reason AS conflictReason,
                COALESCE(e.student_count, enr.enrolledCount, cs.enrolled_count, 0) AS studentCount,
                c.course_code AS courseCode,
                c.course_name AS courseName,
                cs.section_code AS sectionCode,
                cr.classroom_code AS classroomCode,
                CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode,
                cr.classroom_name AS roomName,
                b.building_code AS buildingCode,
                l.lecturer_code AS proctorCode,
                l.full_name AS proctorName
            FROM exams e
            JOIN class_sections cs ON cs.section_id = e.section_id
            JOIN courses c ON c.course_id = cs.course_id
            LEFT JOIN classrooms cr ON cr.classroom_id = e.classroom_id
            LEFT JOIN buildings b ON b.building_id = cr.building_id
            LEFT JOIN lecturers l ON l.lecturer_id = e.proctor_lecturer_id
            LEFT JOIN (
                SELECT section_id, COUNT(DISTINCT student_id) AS enrolledCount
                FROM student_section_enrollments
                WHERE status IS NULL OR status NOT IN ('DROPPED','CANCELLED')
                GROUP BY section_id
            ) enr ON enr.section_id = e.section_id
            WHERE e.exam_id = :examId
              AND e.status NOT IN ('CANCELLED','COMPLETED')
            """, Map.of("examId", examId));

        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("EXAM_NOT_FOUND", "Không tìm thấy ca thi.");
        }

        return rows.get(0);
    }


    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableProctors(
            Long semesterId,
            Date examDate,
            Time startTime,
            Time endTime,
            Long excludeExamId
    ) {
        if (examDate == null || startTime == null || endTime == null) {
            return List.of();
        }

        Map<String, Object> params = new HashMap<>();
        params.put("semesterId", semesterId);
        params.put("examDate", examDate);
        params.put("startTime", startTime);
        params.put("endTime", endTime);
        params.put("excludeExamId", excludeExamId == null ? -1L : excludeExamId);

        return jdbc.queryForList("""
            SELECT
                l.lecturer_id AS lecturerId,
                l.lecturer_code AS lecturerCode,
                l.full_name AS fullName,
                d.department_code AS departmentCode,
                d.department_name AS departmentName
            FROM lecturers l
            LEFT JOIN departments d ON d.department_id = l.department_id
            WHERE l.is_deleted = FALSE
              AND NOT EXISTS (
                  SELECT 1
                  FROM exams e
                  WHERE e.proctor_lecturer_id = l.lecturer_id
                    AND e.exam_id <> :excludeExamId
                    AND e.exam_date = :examDate
                    AND e.status NOT IN ('CANCELLED','COMPLETED')
                    AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM exam_invigilators ei
                  JOIN exams e ON e.exam_id = ei.exam_id
                  WHERE ei.lecturer_id = l.lecturer_id
                    AND e.exam_id <> :excludeExamId
                    AND e.exam_date = :examDate
                    AND e.status NOT IN ('CANCELLED','COMPLETED')
                    AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM class_sessions cs
                  WHERE cs.lecturer_id = l.lecturer_id
                    AND cs.session_date = :examDate
                    AND cs.session_status NOT IN ('CANCELLED')
                    AND NOT (cs.end_time <= :startTime OR cs.start_time >= :endTime)
              )
            ORDER BY l.full_name, l.lecturer_code
            """, params);
    }




    @Transactional
    public Map<String, Object> updateExamAllocation(Long examId, Map<String, Object> body) {
        if (examId == null) {
            throw new BadRequestException("EXAM_REQUIRED", "Không tìm thấy ca thi.");
        }

        Map<String, Object> exam = findExamForUpdate(examId);
        Long semesterId = toLong(exam.get("semesterId"));
        ensureEditableSemester(semesterId);

        Long classroomId = toLong(body == null ? null : body.get("classroomId"));
        String classroomCode = body == null ? "" : String.valueOf(body.getOrDefault("classroomCode", "")).trim();
        Long proctorLecturerId = toLong(body == null ? null : body.get("proctorLecturerId"));

        Date examDate = (Date) exam.get("examDate");
        Time startTime = (Time) exam.get("startTime");
        Time endTime = (Time) exam.get("endTime");
        int studentCount = toInt(exam.get("studentCount"));

        if (classroomId == null && !classroomCode.isEmpty()) {
            classroomId = toLong(findRoomByCode(classroomCode).get("classroomId"));
        }
        if (classroomId == null) {
            throw new BadRequestException("ROOM_REQUIRED", "Vui lòng chọn phòng thi.");
        }

        if (examDate == null || startTime == null || endTime == null || !endTime.after(startTime)) {
            throw new BadRequestException("INVALID_EXAM_TIME", "NgÃ y/giá» thi khÃ´ng há»£p lá»‡, khÃ´ng thá»ƒ phÃ¢n phÃ²ng.");
        }

        Map<String, Object> room = findRoomById(classroomId);
        int capacity = toInt(room.get("capacity"));

        if (capacity < studentCount) {
            throw new BadRequestException("CAPACITY_EXCEEDED", "Phòng thi không đủ sức chứa.");
        }

        if (!isRoomAvailable(classroomId, examId, examDate, startTime, endTime)) {
            throw new BadRequestException("ROOM_CONFLICT", "Phòng đã có lịch sử dụng trong thời gian này.");
        }

        if (proctorLecturerId != null) {
            findLecturerById(proctorLecturerId);
        }
        if (proctorLecturerId != null && !isProctorAvailable(proctorLecturerId, examId, examDate, startTime, endTime)) {
            throw new BadRequestException("PROCTOR_CONFLICT", "Giám thị bị trùng lịch trong thời gian này.");
        }

        jdbc.update("""
            UPDATE exams
            SET classroom_id = :classroomId,
                proctor_lecturer_id = :proctorLecturerId,
                status = 'ROOM_ASSIGNED',
                validation_status = 'NOT_CHECKED',
                conflict_reason = NULL,
                updated_at = NOW()
            WHERE exam_id = :examId
            """, Map.of(
                "examId", examId,
                "classroomId", classroomId,
                "proctorLecturerId", proctorLecturerId
        ));

        jdbc.update("""
            DELETE FROM exam_invigilators
            WHERE exam_id = :examId
              AND role = 'MAIN'
            """, Map.of("examId", examId));

        if (proctorLecturerId != null) {
            jdbc.update("""
                INSERT INTO exam_invigilators (exam_id, lecturer_id, role)
                VALUES (:examId, :lecturerId, 'MAIN')
                ON DUPLICATE KEY UPDATE role = 'MAIN'
                """, Map.of("examId", examId, "lecturerId", proctorLecturerId));
        }

        jdbc.update("""
            UPDATE semesters
            SET exam_workflow_status = 'DRAFT'
            WHERE semester_id = :semesterId
              AND exam_workflow_status NOT IN ('PUBLISHED','LOCKED')
            """, Map.of("semesterId", semesterId));

        return Map.of(
                "message", "Đã cập nhật ca thi.",
                "examId", examId,
                "classroomId", classroomId,
                "proctorLecturerId", proctorLecturerId
        );
    }

    @Transactional
    public Map<String, Object> saveExamNote(Long examId, String note) {
        if (examId == null) {
            throw new BadRequestException("EXAM_REQUIRED", "Không tìm thấy ca thi.");
        }

        String normalizedNote = note == null ? "" : note.trim();
        if (normalizedNote.isEmpty()) {
            throw new BadRequestException("VALIDATION_FAILED", "Validation failed", Map.of("note", "NOTE_REQUIRED"));
        }
        if (normalizedNote.length() > 255) {
            throw new BadRequestException("VALIDATION_FAILED", "Validation failed", Map.of("note", "NOTE_TOO_LONG"));
        }

        Map<String, Object> exam = findExamForUpdate(examId);
        Long semesterId = toLong(exam.get("semesterId"));
        ensureEditableSemester(semesterId);

        int updated = jdbc.update("""
            UPDATE exams
            SET note = :note,
                updated_at = NOW()
            WHERE exam_id = :examId
              AND status NOT IN ('CANCELLED','COMPLETED','PUBLISHED','SCHEDULED')
            """, Map.of("examId", examId, "note", normalizedNote));

        if (updated != 1) {
            throw new BadRequestException("EXAM_NOTE_FAILED", "Không thể lưu ghi chú cho ca thi.");
        }

        return Map.of(
                "message", "Đã lưu ghi chú cho Admin.",
                "examId", examId
        );
    }


    private Map<String, Object> findRoomById(Long classroomId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT
                cr.classroom_id AS classroomId,
                cr.capacity AS capacity,
                cr.classroom_code AS classroomCode,
                CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode
            FROM classrooms cr
            LEFT JOIN buildings b ON b.building_id = cr.building_id
            WHERE cr.classroom_id = :classroomId
              AND cr.is_deleted = FALSE
              AND cr.is_active = TRUE
            """, Map.of("classroomId", classroomId));

        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("CLASSROOM_NOT_FOUND", "Không tìm thấy phòng thi đang hoạt động.");
        }

        return rows.get(0);
    }

    private Map<String, Object> findLecturerById(Long lecturerId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT lecturer_id AS lecturerId
            FROM lecturers
            WHERE lecturer_id = :lecturerId
              AND is_deleted = FALSE
            """, Map.of("lecturerId", lecturerId));

        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("LECTURER_NOT_FOUND", "KhÃ´ng tÃ¬m tháº¥y giÃ¡m thá»‹.");
        }

        return rows.get(0);
    }

    private boolean isProctorAvailable(Long lecturerId, Long currentExamId, Date examDate, Time startTime, Time endTime) {
        Map<String, Object> params = Map.of(
                "lecturerId", lecturerId,
                "examId", currentExamId,
                "examDate", examDate,
                "startTime", startTime,
                "endTime", endTime
        );

        Integer examConflicts = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM exams e
            WHERE e.proctor_lecturer_id = :lecturerId
              AND e.exam_id <> :examId
              AND e.exam_date = :examDate
              AND e.status NOT IN ('CANCELLED','COMPLETED')
              AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
            """, params, Integer.class);
        if (examConflicts != null && examConflicts > 0) return false;

        Integer invigilatorConflicts = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM exam_invigilators ei
            JOIN exams e ON e.exam_id = ei.exam_id
            WHERE ei.lecturer_id = :lecturerId
              AND e.exam_id <> :examId
              AND e.exam_date = :examDate
              AND e.status NOT IN ('CANCELLED','COMPLETED')
              AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
            """, params, Integer.class);
        if (invigilatorConflicts != null && invigilatorConflicts > 0) return false;

        Integer teachingConflicts = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM class_sessions cs
            WHERE cs.lecturer_id = :lecturerId
              AND cs.session_date = :examDate
              AND cs.session_status NOT IN ('CANCELLED')
              AND NOT (cs.end_time <= :startTime OR cs.start_time >= :endTime)
            """, params, Integer.class);

        return teachingConflicts == null || teachingConflicts == 0;
    }

    @Transactional
    public Map<String, Object> cancelExam(Long examId) {
        if (examId == null) {
            throw new BadRequestException("EXAM_REQUIRED", "Không tìm thấy ca thi.");
        }

        Map<String, Object> exam = findExamForUpdate(examId);
        Long semesterId = toLong(exam.get("semesterId"));
        ensureEditableSemester(semesterId);

        jdbc.update("""
            UPDATE exams
            SET status = 'CANCELLED',
                validation_status = 'NOT_CHECKED',
                conflict_reason = NULL,
                cancelled_at = NOW(),
                updated_at = NOW()
            WHERE exam_id = :examId
            """, Map.of("examId", examId));

        jdbc.update("""
            UPDATE semesters
            SET exam_workflow_status = 'DRAFT'
            WHERE semester_id = :semesterId
              AND exam_workflow_status NOT IN ('PUBLISHED','LOCKED')
            """, Map.of("semesterId", semesterId));

        return Map.of(
                "message", "Đã hủy ca thi.",
                "examId", examId
        );
    }
}
