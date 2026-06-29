package com.ptit.qlphonghoc.admin.examworkflow.service;

import com.ptit.qlphonghoc.admin.examimport.dto.ExamUpdateRequest;
import com.ptit.qlphonghoc.admin.examworkflow.dto.ExamWorkflowStatusSummary;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.util.Set;

@Service
public class ExamWorkflowService {

    private static final Set<String> VALIDATABLE = Set.of("DRAFT", "CONFLICT", "READY_FOR_APPROVAL");
    private static final Set<String> ADMIN_EDITABLE_WORKFLOWS = Set.of("DRAFT", "CONFLICT", "READY_FOR_APPROVAL");
    private static final Set<String> EXAM_TYPES = Set.of("MIDTERM", "FINAL", "MAKEUP", "OTHER");
    private static final Set<String> EXAM_METHODS = Set.of("WRITTEN", "ORAL", "PRACTICAL", "ONLINE");

    private final NamedParameterJdbcTemplate jdbc;
    private final JdbcTemplate plain;

    public ExamWorkflowService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.plain = jdbc.getJdbcTemplate();
    }

    @Transactional(readOnly = true)
    public ExamWorkflowStatusSummary getStatus(Long semesterId) {
        Map<String, Object> sem = findSemester(semesterId);
        return buildSummary(sem, (String) sem.get("exam_workflow_status"));
    }

    @Transactional
    public ExamWorkflowStatusSummary validate(Long semesterId, Integer userId) {
        Map<String, Object> sem = findSemesterForUpdate(semesterId);
        String current = (String) sem.get("exam_workflow_status");
        if (!VALIDATABLE.contains(current)) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Không thể kiểm tra lịch thi ở trạng thái: " + current
            );
        }

        Map<String, Object> counts = runValidationChecks(semesterId);
        int total = num(counts, "totalExams");
        int conflicts = num(counts, "conflictCount");
        int invalid = num(counts, "invalidCount");

        String newStatus = (total == 0 || conflicts > 0 || invalid > 0)
                ? "CONFLICT"
                : "READY_FOR_APPROVAL";
        updateWorkflowStatus(semesterId, newStatus);
        return buildSummary(sem, newStatus, counts);
    }

    @Transactional
    public ExamWorkflowStatusSummary approve(Long semesterId, Integer userId) {
        Map<String, Object> sem = findSemesterForUpdate(semesterId);
        String current = (String) sem.get("exam_workflow_status");

        if (!"READY_FOR_APPROVAL".equals(current)) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Chỉ có thể duyệt lịch thi ở trạng thái Chờ duyệt (hiện tại: " + current + ")"
            );
        }

        Map<String, Object> counts = runValidationChecks(semesterId);
        int total = num(counts, "totalExams");
        int conflictCnt = num(counts, "conflictCount");
        int invalidCnt = num(counts, "invalidCount");

        if (total == 0) {
            updateWorkflowStatus(semesterId, "CONFLICT");
            throw new BadRequestException("NO_EXAMS", "Học kỳ chưa có lịch thi để duyệt.");
        }

        if (conflictCnt > 0 || invalidCnt > 0) {
            updateWorkflowStatus(semesterId, "CONFLICT");
            throw new BadRequestException(
                    "EXAM_CONFLICTS",
                    "Lịch thi còn " + conflictCnt + " xung đột hoặc " + invalidCnt + " ca chưa hợp lệ, không thể duyệt."
            );
        }

        updateWorkflowStatus(semesterId, "APPROVED");
        return buildSummary(sem, "APPROVED", counts);
    }


    @Transactional
    public ExamWorkflowStatusSummary publish(Long semesterId, Integer userId) {
        Map<String, Object> sem = findSemesterForUpdate(semesterId);
        String current = (String) sem.get("exam_workflow_status");

        if (!"APPROVED".equals(current)) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Cần duyệt hợp lệ trước khi công bố lịch thi (trạng thái hiện tại: " + current + ")"
            );
        }

        Map<String, Object> counts = runValidationChecks(semesterId);
        int total = num(counts, "totalExams");
        int conflictCnt = num(counts, "conflictCount");
        int invalidCnt = num(counts, "invalidCount");

        if (total == 0) {
            updateWorkflowStatus(semesterId, "CONFLICT");
            throw new BadRequestException("NO_EXAMS", "Học kỳ chưa có lịch thi để công bố.");
        }

        if (conflictCnt > 0 || invalidCnt > 0) {
            updateWorkflowStatus(semesterId, "CONFLICT");
            throw new BadRequestException(
                    "EXAM_CONFLICTS",
                    "Lịch thi còn " + conflictCnt + " xung đột hoặc " + invalidCnt + " ca chưa hợp lệ, không thể công bố."
            );
        }

        plain.update("""
            UPDATE exams
            SET status = 'PUBLISHED',
                published_at = NOW()
            WHERE semester_id = ?
              AND status NOT IN ('CANCELLED','COMPLETED','PUBLISHED')
            """, semesterId);

        updateWorkflowStatus(semesterId, "PUBLISHED");
        return buildSummary(sem, "PUBLISHED", countExams(semesterId));
    }


    @Transactional
    public ExamWorkflowStatusSummary lock(Long semesterId, Integer userId) {
        Map<String, Object> sem = findSemesterForUpdate(semesterId);
        String current = (String) sem.get("exam_workflow_status");
        if (!"PUBLISHED".equals(current)) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Chỉ có thể khoá lịch thi đã công bố (trạng thái hiện tại: " + current + ")"
            );
        }
        updateWorkflowStatus(semesterId, "LOCKED");
        return buildSummary(sem, "LOCKED", countExams(semesterId));
    }

    @Transactional
    public ExamWorkflowStatusSummary reopen(Long semesterId, Integer userId) {
        Map<String, Object> sem = findSemesterForUpdate(semesterId);
        String current = (String) sem.get("exam_workflow_status");

        if (!Set.of("READY_FOR_APPROVAL", "APPROVED", "PUBLISHED", "LOCKED").contains(current)) {
            throw new BadRequestException(
                    "INVALID_STATUS",
                    "Chỉ có thể mở lại lịch thi ở trạng thái Chờ duyệt, Đã duyệt, Đã công bố hoặc Đã khoá (hiện tại: " + current + ")"
            );
        }

        plain.update("""
            UPDATE exams
            SET status = CASE
                    WHEN classroom_id IS NULL THEN 'NEEDS_ROOM'
                    ELSE 'ROOM_ASSIGNED'
                END,
                published_at = NULL,
                validation_status = 'NOT_CHECKED',
                conflict_reason = NULL
            WHERE semester_id = ?
              AND status NOT IN ('CANCELLED','COMPLETED')
            """, semesterId);

        updateWorkflowStatus(semesterId, "DRAFT");
        return buildSummary(sem, "DRAFT", countExams(semesterId));
    }



    @Transactional(readOnly = true)
    public Map<String, Object> getEditOptions(Long examId) {
        return getEditOptions(examId, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEditOptions(Long examId, String overrideExamDate, String overrideStartTime, String overrideEndTime, Integer overrideMinCapacity) {
        if (examId == null) {
            throw new BadRequestException("EXAM_REQUIRED", "Không tìm thấy lịch thi.");
        }

        Map<String, Object> exam = findExamDetail(examId);

        Long semesterId = toLong(exam.get("semesterId"));
        Date examDate = (Date) exam.get("examDate");
        Time startTime = (Time) exam.get("startTime");
        Time endTime = (Time) exam.get("endTime");
        Integer studentCount = toInt(exam.get("studentCount"));
        String optionDate = isBlank(overrideExamDate) ? (examDate == null ? null : examDate.toString()) : overrideExamDate;
        String optionStartTime = isBlank(overrideStartTime) ? (startTime == null ? null : startTime.toString()) : overrideStartTime;
        String optionEndTime = isBlank(overrideEndTime) ? (endTime == null ? null : endTime.toString()) : overrideEndTime;
        Integer minCapacity = overrideMinCapacity != null ? overrideMinCapacity : studentCount;

        List<Map<String, Object>> rooms = getAvailableRooms(
                semesterId,
                optionDate,
                optionStartTime,
                optionEndTime,
                minCapacity,
                examId
        );

        List<Map<String, Object>> proctors = getAvailableProctors(
                semesterId,
                optionDate,
                optionStartTime,
                optionEndTime,
                examId
        );

        return Map.of(
                "exam", exam,
                "availableRooms", rooms,
                "availableProctors", proctors
        );
    }

    // Detail Exam
    private Map<String, Object> findExamDetail(Long examId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT
                e.exam_id AS examId,
                e.exam_id AS id,
                e.semester_id AS semesterId,
                e.section_id AS sectionId,
                e.classroom_id AS classroomId,
                e.proctor_lecturer_id AS proctorLecturerId,
                e.proctor_lecturer_id AS mainProctorId,
                e.exam_date AS examDate,
                e.start_time AS startTime,
                e.end_time AS endTime,
                e.exam_type AS examType,
                e.exam_method AS examMethod,
                e.student_count AS studentCount,
                e.seat_range AS seatRange,
                e.note AS note,
                e.status AS status,
                e.validation_status AS validationStatus,
                e.conflict_reason AS conflictReason,
                c.course_code AS courseCode,
                c.course_name AS courseName,
                cs.section_code AS sectionCode,
                CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode,
                CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS classroomCode,
                cr.classroom_name AS roomName,
                b.building_code AS buildingCode,
                l.lecturer_code AS mainProctorCode,
                l.lecturer_code AS proctorCode,
                l.full_name AS mainProctorName,
                l.full_name AS proctorName
            FROM exams e
            JOIN class_sections cs ON cs.section_id = e.section_id
            JOIN courses c ON c.course_id = cs.course_id
            LEFT JOIN classrooms cr ON cr.classroom_id = e.classroom_id
            LEFT JOIN buildings b ON b.building_id = cr.building_id
            LEFT JOIN lecturers l ON l.lecturer_id = e.proctor_lecturer_id
            WHERE e.exam_id = :examId
            """, Map.of("examId", examId));

        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("EXAM_NOT_FOUND", "Không tìm thấy lịch thi.");
        }

        return rows.get(0);
    }


    // empty room
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableRooms(
            Long semesterId,
            String examDate,
            String startTime,
            String endTime,
            Integer minCapacity,
            Long excludeExamId
    ) {
        if (isBlank(examDate) || isBlank(startTime) || isBlank(endTime)) {
            throw new BadRequestException("TIME_REQUIRED", "Cần ngày thi, giờ bắt đầu và giờ kết thúc để tìm phòng.");
        }

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("semesterId", semesterId)
                .addValue("examDate", Date.valueOf(LocalDate.parse(examDate.substring(0, 10))))
                .addValue("startTime", Time.valueOf(normalizeTime(startTime)))
                .addValue("endTime", Time.valueOf(normalizeTime(endTime)))
                .addValue("minCapacity", minCapacity)
                .addValue("excludeExamId", excludeExamId == null ? -1L : excludeExamId);

        return jdbc.queryForList("""
            SELECT
                cr.classroom_id AS classroomId,
                cr.room_number AS roomNumber,
                cr.classroom_name AS roomName,
                cr.classroom_name AS classroomName,
                cr.capacity AS capacity,
                cr.room_type AS roomType,
                CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS roomCode,
                CONCAT(COALESCE(b.building_code, ''), IF(b.building_code IS NULL, '', '-'), cr.room_number) AS classroomCode,
                b.building_id AS buildingId,
                b.building_code AS buildingCode,
                b.building_name AS buildingName
            FROM classrooms cr
            LEFT JOIN buildings b ON b.building_id = cr.building_id
            WHERE cr.is_deleted = FALSE
              AND cr.is_active = TRUE
              AND (:minCapacity IS NULL OR cr.capacity >= :minCapacity)
              AND NOT EXISTS (
                  SELECT 1
                  FROM exams e
                  WHERE e.classroom_id = cr.classroom_id
                    AND e.exam_id <> :excludeExamId
                    AND e.exam_date = :examDate
                    AND e.status NOT IN ('CANCELLED','COMPLETED')
                    AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM class_sessions cs
                  WHERE cs.classroom_id = cr.classroom_id
                    AND cs.session_date = :examDate
                    AND cs.session_status NOT IN ('CANCELLED')
                    AND NOT (cs.end_time <= :startTime OR cs.start_time >= :endTime)
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM room_borrow_requests rbr
                  WHERE rbr.approved_classroom_id = cr.classroom_id
                    AND rbr.booking_date = :examDate
                    AND rbr.status = 'APPROVED'
                    AND NOT (rbr.end_time <= :startTime OR rbr.start_time >= :endTime)
              )
            ORDER BY cr.capacity ASC, b.building_code, cr.room_number
            """, params);
    }

    // available dropdown
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableProctors(
            Long semesterId,
            String examDate,
            String startTime,
            String endTime,
            Long excludeExamId
    ) {
        if (isBlank(examDate) || isBlank(startTime) || isBlank(endTime)) {
            throw new BadRequestException("TIME_REQUIRED", "Cần ngày thi, giờ bắt đầu và giờ kết thúc để tìm giám thị.");
        }

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("semesterId", semesterId)
                .addValue("examDate", Date.valueOf(LocalDate.parse(examDate.substring(0, 10))))
                .addValue("startTime", Time.valueOf(normalizeTime(startTime)))
                .addValue("endTime", Time.valueOf(normalizeTime(endTime)))
                .addValue("excludeExamId", excludeExamId == null ? -1L : excludeExamId);

        return jdbc.queryForList("""
            SELECT
                l.lecturer_id AS lecturerId,
                l.lecturer_code AS lecturerCode,
                l.full_name AS fullName,
                d.department_id AS departmentId,
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
    public Map<String, Object> updateExam(Long examId, ExamUpdateRequest req) {
        if (examId == null) {
            throw new BadRequestException("EXAM_REQUIRED", "Khong tim thay lich thi.");
        }
        if (req == null) {
            throw new BadRequestException("VALIDATION", "Du lieu cap nhat khong hop le.");
        }

        Map<String, Object> exam = findExamForUpdate(examId);
        Long semesterId = toLong(exam.get("semesterId"));
        Map<String, Object> semester = findSemesterForUpdate(semesterId);
        String workflowStatus = text(semester.get("exam_workflow_status"));
        if (!ADMIN_EDITABLE_WORKFLOWS.contains(workflowStatus)) {
            throw new BadRequestException("EXAM_TIMETABLE_READ_ONLY", "Lich thi da cong bo/da khoa, can mo lai workflow truoc khi sua.");
        }

        LocalDate examDate = parseDate(req.examDate());
        LocalTime startTime = parseTime(req.startTime());
        LocalTime endTime = parseTime(req.endTime());
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("INVALID_EXAM_TIME", "Gio ket thuc phai sau gio bat dau.");
        }

        String examType = isBlank(req.examType()) ? text(exam.get("examType")) : req.examType().trim().toUpperCase();
        if (isBlank(examType) || !EXAM_TYPES.contains(examType)) {
            throw new BadRequestException("VALIDATION", "exam_type khong hop le.");
        }
        String examMethod = isBlank(req.examMethod()) ? null : req.examMethod().trim().toUpperCase();
        if (examMethod != null && !EXAM_METHODS.contains(examMethod)) {
            throw new BadRequestException("VALIDATION", "exam_method khong hop le.");
        }

        int studentCount = req.studentCount() != null ? req.studentCount() : toInt(exam.get("studentCount"));
        if (studentCount <= 0) {
            throw new BadRequestException("VALIDATION", "So sinh vien du thi phai lon hon 0.");
        }

        Long classroomId = resolveClassroomId(req.classroomId(), req.classroomCode());
        if (classroomId != null) {
            Map<String, Object> room = findRoomById(classroomId);
            if (toInt(room.get("capacity")) < studentCount) {
                throw new BadRequestException("CAPACITY_EXCEEDED", "Phong thi khong du suc chua.");
            }
            if (!isRoomAvailable(classroomId, examId, Date.valueOf(examDate), Time.valueOf(startTime), Time.valueOf(endTime))) {
                throw new BadRequestException("ROOM_CONFLICT", "Phong da co lich su dung trong thoi gian nay.");
            }
        }

        Long mainProctorId = resolveLecturerId(
                req.mainProctorId() != null ? req.mainProctorId() : req.proctorLecturerId(),
                req.mainProctorCode()
        );
        Long assistantProctorId = resolveLecturerId(req.assistantProctorId(), req.assistantProctorCode());

        if (mainProctorId != null && assistantProctorId != null && mainProctorId.equals(assistantProctorId)) {
            throw new BadRequestException("PROCTOR_CONFLICT", "Giam thi chinh va giam thi phu khong duoc trung nhau.");
        }
        if (mainProctorId != null) {
            findLecturerById(mainProctorId);
            if (!isProctorAvailable(mainProctorId, examId, Date.valueOf(examDate), Time.valueOf(startTime), Time.valueOf(endTime))) {
                throw new BadRequestException("PROCTOR_CONFLICT", "Giam thi chinh bi trung lich trong thoi gian nay.");
            }
        }
        if (assistantProctorId != null) {
            findLecturerById(assistantProctorId);
            if (!isProctorAvailable(assistantProctorId, examId, Date.valueOf(examDate), Time.valueOf(startTime), Time.valueOf(endTime))) {
                throw new BadRequestException("PROCTOR_CONFLICT", "Giam thi phu bi trung lich trong thoi gian nay.");
            }
        }

        MapSqlParameterSource updateParams = new MapSqlParameterSource()
                .addValue("examId", examId)
                .addValue("examDate", Date.valueOf(examDate))
                .addValue("startTime", Time.valueOf(startTime))
                .addValue("endTime", Time.valueOf(endTime))
                .addValue("classroomId", classroomId)
                .addValue("mainProctorId", mainProctorId)
                .addValue("examType", examType)
                .addValue("examMethod", examMethod)
                .addValue("studentCount", studentCount)
                .addValue("seatRange", req.seatRange())
                .addValue("note", req.note());

        jdbc.update("""
                UPDATE exams
                SET exam_date = :examDate,
                    start_time = :startTime,
                    end_time = :endTime,
                    classroom_id = :classroomId,
                    proctor_lecturer_id = :mainProctorId,
                    exam_type = :examType,
                    exam_method = :examMethod,
                    student_count = :studentCount,
                    seat_range = :seatRange,
                    note = :note,
                    status = CASE WHEN :classroomId IS NULL THEN 'NEEDS_ROOM' ELSE 'ROOM_ASSIGNED' END,
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL,
                    published_at = NULL,
                    updated_at = NOW()
                WHERE exam_id = :examId
                """, updateParams);

        jdbc.update("DELETE FROM exam_invigilators WHERE exam_id = :examId", Map.of("examId", examId));
        insertInvigilator(examId, mainProctorId, "MAIN");
        insertInvigilator(examId, assistantProctorId, "ASSISTANT");

        updateWorkflowStatus(semesterId, "DRAFT");

        Map<String, Object> result = new HashMap<>();
        result.put("examId", examId);
        result.put("semesterId", semesterId);
        result.put("classroomId", classroomId);
        result.put("mainProctorId", mainProctorId);
        result.put("proctorLecturerId", mainProctorId);
        result.put("assistantProctorId", assistantProctorId);
        result.put("status", classroomId == null ? "NEEDS_ROOM" : "ROOM_ASSIGNED");
        result.put("validationStatus", "NOT_CHECKED");
        return result;
    }

    private Map<String, Object> findExamForUpdate(Long examId) {
        List<Map<String, Object>> rows = plain.queryForList("""
                SELECT
                    e.exam_id AS examId,
                    e.semester_id AS semesterId,
                    e.exam_type AS examType,
                    COALESCE(e.student_count, enr.enrolledCount, cs.enrolled_count, 0) AS studentCount,
                    e.status AS status
                FROM exams e
                JOIN class_sections cs ON cs.section_id = e.section_id
                LEFT JOIN (
                    SELECT section_id, COUNT(DISTINCT student_id) AS enrolledCount
                    FROM student_section_enrollments
                    WHERE status IS NULL OR status NOT IN ('DROPPED','CANCELLED')
                    GROUP BY section_id
                ) enr ON enr.section_id = e.section_id
                WHERE e.exam_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                FOR UPDATE
                """, examId);
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("EXAM_NOT_FOUND", "Khong tim thay lich thi.");
        }
        String status = text(rows.get(0).get("status"));
        if (Set.of("PUBLISHED", "SCHEDULED", "CANCELLED", "COMPLETED").contains(status)) {
            throw new BadRequestException("EXAM_TIMETABLE_READ_ONLY", "Lich thi khong con duoc phep sua.");
        }
        return rows.get(0);
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
            throw new ResourceNotFoundException("CLASSROOM_NOT_FOUND", "Khong tim thay phong thi dang hoat dong.");
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
            throw new ResourceNotFoundException("LECTURER_NOT_FOUND", "Khong tim thay giang vien/giam thi.");
        }
        return rows.get(0);
    }

    private boolean isRoomAvailable(Long classroomId, Long currentExamId, Date examDate, Time startTime, Time endTime) {
        Map<String, Object> params = Map.of(
                "classroomId", classroomId,
                "examId", currentExamId,
                "examDate", examDate,
                "startTime", startTime,
                "endTime", endTime
        );

        Integer examConflicts = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM exams e
                WHERE e.classroom_id = :classroomId
                  AND e.exam_id <> :examId
                  AND e.exam_date = :examDate
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
                """, params, Integer.class);
        if (examConflicts != null && examConflicts > 0) return false;

        Integer sessionConflicts = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM class_sessions cs
                WHERE cs.classroom_id = :classroomId
                  AND cs.session_date = :examDate
                  AND cs.session_status NOT IN ('CANCELLED')
                  AND NOT (cs.end_time <= :startTime OR cs.start_time >= :endTime)
                """, params, Integer.class);
        if (sessionConflicts != null && sessionConflicts > 0) return false;

        Integer borrowConflicts = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM room_borrow_requests rbr
                WHERE rbr.approved_classroom_id = :classroomId
                  AND rbr.booking_date = :examDate
                  AND rbr.status = 'APPROVED'
                  AND NOT (rbr.end_time <= :startTime OR rbr.start_time >= :endTime)
                """, params, Integer.class);
        return borrowConflicts == null || borrowConflicts == 0;
    }

    private boolean isProctorAvailable(Long lecturerId, Long currentExamId, Date examDate, Time startTime, Time endTime) {
        Map<String, Object> params = Map.of(
                "lecturerId", lecturerId,
                "examId", currentExamId,
                "examDate", examDate,
                "startTime", startTime,
                "endTime", endTime
        );

        Integer mainConflicts = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM exams e
                WHERE e.proctor_lecturer_id = :lecturerId
                  AND e.exam_id <> :examId
                  AND e.exam_date = :examDate
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
                """, params, Integer.class);
        if (mainConflicts != null && mainConflicts > 0) return false;

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

    private void insertInvigilator(Long examId, Long lecturerId, String role) {
        if (lecturerId == null) return;
        jdbc.update("""
                INSERT INTO exam_invigilators (exam_id, lecturer_id, role)
                VALUES (:examId, :lecturerId, :role)
                ON DUPLICATE KEY UPDATE role = VALUES(role)
                """, Map.of("examId", examId, "lecturerId", lecturerId, "role", role));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Validation
    // ─────────────────────────────────────────────────────────────────────

    private Map<String, Object> runValidationChecks(Long semesterId) {
        resetValidation(semesterId);
        syncStudentCounts(semesterId);
        normalizeRoomAssignmentStatuses(semesterId);

        validateMissingRoom(semesterId);
        validateInvalidDate(semesterId);
        validateDateOutsideSemester(semesterId);
        validateInvalidTimeRange(semesterId);
        validateMissingStudents(semesterId);
        validateInactiveRooms(semesterId);
        validateCapacity(semesterId);
        validateMissingProctor(semesterId);
        validateRoomExamConflict(semesterId);
        validateProctorConflictByInvigilators(semesterId);
        validateProctorConflictByLegacyColumn(semesterId);
        validateRoomClassSessionConflict(semesterId);
        validateRoomBorrowConflict(semesterId);
        validateStudentExamConflict(semesterId);


        plain.update("""
                UPDATE exams
                SET validation_status = 'VALID'
                WHERE semester_id = ?
                  AND status NOT IN ('CANCELLED','COMPLETED')
                  AND validation_status = 'NOT_CHECKED'
                """, semesterId);

        return countExams(semesterId);
    }

    private void resetValidation(Long semesterId) {
        plain.update("""
                UPDATE exams
                SET validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL
                WHERE semester_id = ?
                  AND status NOT IN ('CANCELLED','COMPLETED')
                """, semesterId);
    }

    /**
     * Số SV của lịch thi không lấy cứng từ file import.
     * Luôn tính lại theo enrollment thực tế; nếu chưa có enrollment thì fallback class_sections.enrolled_count.
     */
    private void syncStudentCounts(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN class_sections cs ON cs.section_id = e.section_id
                LEFT JOIN (
                    SELECT section_id, COUNT(*) AS enrolled_count
                    FROM student_section_enrollments
                    WHERE status <> 'DROPPED'
                    GROUP BY section_id
                ) enr ON enr.section_id = e.section_id
                SET e.student_count = COALESCE(enr.enrolled_count, cs.enrolled_count, e.student_count)
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                """, semesterId);
    }

    /**
     * File import được phép thiếu phòng.
     * Thiếu phòng sẽ về NEEDS_ROOM để Staff chạy phân phòng thi; có phòng thì về ROOM_ASSIGNED.
     */
    private void normalizeRoomAssignmentStatuses(Long semesterId) {
        plain.update("""
                UPDATE exams
                SET status = 'NEEDS_ROOM'
                WHERE semester_id = ?
                  AND status IN ('DRAFT','ROOM_ASSIGNED','READY_FOR_APPROVAL')
                  AND classroom_id IS NULL
                """, semesterId);

        plain.update("""
                UPDATE exams
                SET status = 'ROOM_ASSIGNED'
                WHERE semester_id = ?
                  AND status IN ('DRAFT','NEEDS_ROOM')
                  AND classroom_id IS NOT NULL
                """, semesterId);
    }

    private void validateMissingRoom(Long semesterId) {
        markConflict(semesterId, "Chưa phân phòng thi", """
                e.classroom_id IS NULL
                """);
    }

    private void validateInvalidDate(Long semesterId) {
        markConflict(semesterId, "Ngày thi không hợp lệ", """
                e.exam_date IS NULL
                """);
    }

    private void validateDateOutsideSemester(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN semesters s ON s.semester_id = e.semester_id
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND e.exam_date IS NOT NULL
                  AND (e.exam_date < s.start_date OR e.exam_date > s.end_date)
                """.formatted(appendReasonSql("'Ngày thi ngoài học kỳ'")), semesterId);
    }

    private void validateInvalidTimeRange(Long semesterId) {
        markConflict(semesterId, "Giờ thi không hợp lệ", """
                e.start_time IS NULL OR e.end_time IS NULL OR e.end_time <= e.start_time
                """);
    }

    private void validateMissingStudents(Long semesterId) {
        markConflict(semesterId, "Không có sinh viên dự thi", """
                e.student_count IS NULL OR e.student_count <= 0
                """);
    }

    private void validateInactiveRooms(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN classrooms c ON c.classroom_id = e.classroom_id
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND (c.is_active = FALSE OR c.is_deleted = TRUE)
                """.formatted(appendReasonSql("'Phòng thi không hoạt động hoặc đã bị xóa'")), semesterId);
    }

    private void validateCapacity(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN classrooms c ON c.classroom_id = e.classroom_id
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND e.student_count IS NOT NULL
                  AND e.student_count > c.capacity
                """.formatted(appendReasonSql("'Phòng thi không đủ sức chứa'")), semesterId);
    }

    private void validateMissingProctor(Long semesterId) {
        plain.update("""
                UPDATE exams e
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND e.proctor_lecturer_id IS NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM exam_invigilators ei
                      WHERE ei.exam_id = e.exam_id
                  )
                """.formatted(appendReasonSql("'Chưa phân công giám thị'")), semesterId);
    }

    private void validateRoomExamConflict(Long semesterId) {
        plain.update("""
                UPDATE exams e1
                JOIN exams e2 ON e2.classroom_id = e1.classroom_id
                    AND e2.exam_date = e1.exam_date
                    AND e2.exam_id <> e1.exam_id
                    AND e2.status NOT IN ('CANCELLED','COMPLETED')
                    AND e2.classroom_id IS NOT NULL
                    AND NOT (e2.end_time <= e1.start_time OR e2.start_time >= e1.end_time)
                SET e1.validation_status = 'CONFLICT',
                    e1.conflict_reason = TRIM(CONCAT(
                        COALESCE(e1.conflict_reason,''),
                        IF(e1.conflict_reason IS NOT NULL AND e1.conflict_reason != '','; ',''),
                        'Xung đột phòng thi với ca thi khác'
                    ))
                WHERE e1.semester_id = ?
                  AND e1.status NOT IN ('CANCELLED','COMPLETED')
                  AND e1.classroom_id IS NOT NULL
                """, semesterId);
    }

    private void validateProctorConflictByInvigilators(Long semesterId) {
        plain.update("""
                UPDATE exams e1
                JOIN exam_invigilators ei1 ON ei1.exam_id = e1.exam_id
                JOIN exam_invigilators ei2 ON ei2.lecturer_id = ei1.lecturer_id
                    AND ei2.exam_id <> e1.exam_id
                JOIN exams e2 ON e2.exam_id = ei2.exam_id
                    AND e2.exam_date = e1.exam_date
                    AND e2.status NOT IN ('CANCELLED','COMPLETED')
                    AND NOT (e2.end_time <= e1.start_time OR e2.start_time >= e1.end_time)
                SET e1.validation_status = 'CONFLICT',
                    e1.conflict_reason = TRIM(CONCAT(
                        COALESCE(e1.conflict_reason,''),
                        IF(e1.conflict_reason IS NOT NULL AND e1.conflict_reason != '','; ',''),
                        'Xung đột giám thị'
                    ))
                WHERE e1.semester_id = ?
                  AND e1.status NOT IN ('CANCELLED','COMPLETED')
                """, semesterId);
    }

    private void validateProctorConflictByLegacyColumn(Long semesterId) {
        plain.update("""
                UPDATE exams e1
                JOIN exams e2 ON e2.proctor_lecturer_id = e1.proctor_lecturer_id
                    AND e2.exam_date = e1.exam_date
                    AND e2.exam_id <> e1.exam_id
                    AND e2.status NOT IN ('CANCELLED','COMPLETED')
                    AND NOT (e2.end_time <= e1.start_time OR e2.start_time >= e1.end_time)
                SET e1.validation_status = 'CONFLICT',
                    e1.conflict_reason = TRIM(CONCAT(
                        COALESCE(e1.conflict_reason,''),
                        IF(e1.conflict_reason IS NOT NULL AND e1.conflict_reason != '','; ',''),
                        'Xung đột giám thị'
                    ))
                WHERE e1.semester_id = ?
                  AND e1.status NOT IN ('CANCELLED','COMPLETED')
                  AND e1.proctor_lecturer_id IS NOT NULL
                """, semesterId);
    }



    private void validateRoomClassSessionConflict(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN class_sessions csn ON csn.classroom_id = e.classroom_id
                    AND csn.session_date = e.exam_date
                    AND csn.session_status NOT IN ('CANCELLED')
                    AND NOT (csn.end_time <= e.start_time OR csn.start_time >= e.end_time)
                JOIN class_sections sec ON sec.section_id = csn.section_id
                    AND sec.status <> 'CANCELLED'
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND e.classroom_id IS NOT NULL
                """.formatted(appendReasonSql("'Trùng lịch học đang sử dụng phòng'")), semesterId);
    }

    private void validateRoomSchedulePatternConflict(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN semester_weeks sw ON sw.semester_id = e.semester_id
                    AND e.exam_date BETWEEN sw.start_date AND sw.end_date
                JOIN schedules sch ON sch.classroom_id = e.classroom_id
                    AND sch.status NOT IN ('CANCELLED','INACTIVE')
                    AND (sch.from_week_no IS NULL OR sch.from_week_no <= sw.week_no)
                    AND (sch.to_week_no IS NULL OR sch.to_week_no >= sw.week_no)
                    AND sch.day_of_week = CASE DAYOFWEEK(e.exam_date)
                        WHEN 1 THEN 'SUN'
                        WHEN 2 THEN 'MON'
                        WHEN 3 THEN 'TUE'
                        WHEN 4 THEN 'WED'
                        WHEN 5 THEN 'THU'
                        WHEN 6 THEN 'FRI'
                        WHEN 7 THEN 'SAT'
                    END
                    AND NOT (sch.end_time <= e.start_time OR sch.start_time >= e.end_time)
                JOIN class_sections sec ON sec.section_id = sch.section_id
                    AND sec.semester_id = e.semester_id
                    AND sec.status <> 'CANCELLED'
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND e.classroom_id IS NOT NULL
                """.formatted(appendReasonSql("'Trùng lịch học đang sử dụng phòng'")), semesterId);
    }

    private void validateCalendarBlockConflict(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN academic_calendar_blocks acb
                    ON acb.semester_id = e.semester_id
                   AND e.exam_date BETWEEN acb.start_date AND acb.end_date
                   AND acb.block_type IN ('HOLIDAY','BREAK')
                   AND acb.is_teaching_allowed = FALSE
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = TRIM(CONCAT(
                        COALESCE(e.conflict_reason,''),
                        IF(e.conflict_reason IS NOT NULL AND e.conflict_reason != '','; ',''),
                        'Ngày thi trùng lịch nghỉ: ',
                        acb.title
                    ))
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND e.exam_date IS NOT NULL
                """, semesterId);
    }

    private void validateRoomBorrowConflict(Long semesterId) {
        plain.update("""
                UPDATE exams e
                JOIN room_borrow_requests rbr ON rbr.approved_classroom_id = e.classroom_id
                    AND rbr.semester_id = e.semester_id
                    AND rbr.booking_date = e.exam_date
                    AND rbr.status = 'APPROVED'
                    AND NOT (rbr.end_time <= e.start_time OR rbr.start_time >= e.end_time)
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND e.classroom_id IS NOT NULL
                """.formatted(appendReasonSql("'Trùng lịch mượn phòng'")), semesterId);
    }

    private void validateStudentExamConflict(Long semesterId) {
        plain.update("""
                UPDATE exams e1
                JOIN student_section_enrollments se1 ON se1.section_id = e1.section_id
                    AND se1.status <> 'DROPPED'
                JOIN student_section_enrollments se2 ON se2.student_id = se1.student_id
                    AND se2.section_id <> se1.section_id
                    AND se2.status <> 'DROPPED'
                JOIN exams e2 ON e2.section_id = se2.section_id
                    AND e2.semester_id = e1.semester_id
                    AND e2.exam_id <> e1.exam_id
                    AND e2.exam_date = e1.exam_date
                    AND e2.status NOT IN ('CANCELLED','COMPLETED')
                    AND NOT (e2.end_time <= e1.start_time OR e2.start_time >= e1.end_time)
                SET e1.validation_status = 'CONFLICT',
                    e1.conflict_reason = TRIM(CONCAT(
                        COALESCE(e1.conflict_reason,''),
                        IF(e1.conflict_reason IS NOT NULL AND e1.conflict_reason != '','; ',''),
                        'Sinh viên bị trùng ca thi'
                    ))
                WHERE e1.semester_id = ?
                  AND e1.status NOT IN ('CANCELLED','COMPLETED')
                """, semesterId);
    }

    private void markConflict(Long semesterId, String reason, String conditionSql) {
        plain.update("""
                UPDATE exams e
                SET e.validation_status = 'CONFLICT',
                    e.conflict_reason = %s
                WHERE e.semester_id = ?
                  AND e.status NOT IN ('CANCELLED','COMPLETED')
                  AND (%s)
                """.formatted(appendReasonSql("'" + reason.replace("'", "''") + "'"), conditionSql), semesterId);
    }

    private String appendReasonSql(String reasonSql) {
        return """
                TRIM(CONCAT(
                    COALESCE(e.conflict_reason,''),
                    IF(e.conflict_reason IS NOT NULL AND e.conflict_reason != '','; ',''),
                    %s
                ))
                """.formatted(reasonSql);
    }



    // ─────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────

    private Long resolveClassroomId(Object classroomIdValue, Object classroomCodeValue) {
        Long classroomId = toLong(classroomIdValue);
        if (classroomId != null) return classroomId;

        String classroomCode = text(classroomCodeValue);
        if (isBlank(classroomCode)) return null;

        String normalized = classroomCode.toUpperCase().replace(" ", "");

        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT cr.classroom_id AS classroomId
            FROM classrooms cr
            LEFT JOIN buildings b ON b.building_id = cr.building_id
            WHERE cr.is_deleted = FALSE
              AND cr.is_active = TRUE
              AND (
                  UPPER(REPLACE(cr.classroom_code, ' ', '')) = :code
                  OR UPPER(REPLACE(cr.room_number, ' ', '')) = :code
                  OR UPPER(REPLACE(cr.classroom_name, ' ', '')) = :code
                  OR UPPER(REPLACE(CONCAT(COALESCE(b.building_code, ''), '-', cr.room_number), ' ', '')) = :code
                  OR UPPER(REPLACE(CONCAT(COALESCE(b.building_code, ''), cr.room_number), ' ', '')) = :code
              )
            LIMIT 1
            """, Map.of("code", normalized));

        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("CLASSROOM_NOT_FOUND", "Không tìm thấy phòng thi.");
        }

        return toLong(rows.get(0).get("classroomId"));
    }

    private Long resolveLecturerId(Object lecturerIdValue, Object lecturerCodeValue) {
        Long lecturerId = toLong(lecturerIdValue);
        if (lecturerId != null) return lecturerId;

        String lecturerCode = text(lecturerCodeValue);
        if (isBlank(lecturerCode)) return null;

        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT lecturer_id AS lecturerId
            FROM lecturers
            WHERE is_deleted = FALSE
              AND UPPER(lecturer_code) = UPPER(:code)
            LIMIT 1
            """, Map.of("code", lecturerCode.trim()));

        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("LECTURER_NOT_FOUND", "Không tìm thấy giảng viên/giám thị.");
        }

        return toLong(rows.get(0).get("lecturerId"));
    }

    private Map<String, Object> findSemester(Long semesterId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT semester_id, semester_name, exam_workflow_status
                FROM semesters
                WHERE semester_id = :id
                  AND is_deleted = FALSE
                """, Map.of("id", semesterId));
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Không tìm thấy học kỳ.");
        }
        return rows.get(0);
    }

    private Map<String, Object> findSemesterForUpdate(Long semesterId) {
        List<Map<String, Object>> rows = plain.queryForList("""
                SELECT semester_id, semester_name, exam_workflow_status
                FROM semesters
                WHERE semester_id = ?
                  AND is_deleted = FALSE
                FOR UPDATE
                """, semesterId);
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Không tìm thấy học kỳ.");
        }
        return rows.get(0);
    }

    private void updateWorkflowStatus(Long semesterId, String status) {
        plain.update("""
                UPDATE semesters
                SET exam_workflow_status = ?
                WHERE semester_id = ?
                """, status, semesterId);
    }

    private Map<String, Object> countExams(Long semesterId) {
        List<Map<String, Object>> rows = plain.queryForList("""
                SELECT
                    COUNT(*) AS totalExams,
                    SUM(CASE WHEN validation_status = 'VALID' THEN 1 ELSE 0 END) AS validCount,
                    SUM(CASE WHEN validation_status = 'CONFLICT' THEN 1 ELSE 0 END) AS conflictCount,
                    SUM(CASE WHEN validation_status <> 'VALID' THEN 1 ELSE 0 END) AS invalidCount,
                    SUM(CASE WHEN status IN ('DRAFT','NEEDS_ROOM','ROOM_ASSIGNED','READY_FOR_APPROVAL') THEN 1 ELSE 0 END) AS draftCount,
                    SUM(CASE WHEN status = 'NEEDS_ROOM' THEN 1 ELSE 0 END) AS needsRoomCount,
                    SUM(CASE WHEN status = 'ROOM_ASSIGNED' THEN 1 ELSE 0 END) AS roomAssignedCount,
                    SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) AS publishedCount
                FROM exams
                WHERE semester_id = ?
                  AND status NOT IN ('CANCELLED','COMPLETED')
                """, semesterId);
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    private ExamWorkflowStatusSummary buildSummary(Map<String, Object> sem, String workflowStatus) {
        return buildSummary(sem, workflowStatus, countExams(toLong(sem.get("semester_id"))));
    }

    private ExamWorkflowStatusSummary buildSummary(Map<String, Object> sem, String workflowStatus, Map<String, Object> counts) {
        return new ExamWorkflowStatusSummary(
                toLong(sem.get("semester_id")),
                (String) sem.get("semester_name"),
                workflowStatus,
                num(counts, "totalExams"),
                num(counts, "validCount"),
                num(counts, "conflictCount"),
                num(counts, "draftCount"),
                num(counts, "publishedCount")
        );
    }

    private static int num(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? 0 : ((Number) v).intValue();
    }

    private static Long toLong(Object v) {
        if (v == null) return null;
        if (v instanceof Number number) return number.longValue();
        String text = String.valueOf(v).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text) || "__NONE__".equals(text)) return null;
        return Long.parseLong(text);
    }

    private static int toInt(Object v) {
        if (v == null) return 0;
        if (v instanceof Number number) return number.intValue();
        String text = String.valueOf(v).trim();
        return text.isEmpty() ? 0 : Integer.parseInt(text);
    }

    private static String text(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim());
    }

    private static String normalizeTime(String value) {
        LocalTime time = parseTime(value);
        return time.toString().length() == 5 ? time + ":00" : time.toString();
    }

    private static LocalDate parseDate(String value) {
        if (isBlank(value)) {
            throw new BadRequestException("INVALID_EXAM_TIME", "Ngay thi bat buoc.");
        }
        try {
            return LocalDate.parse(value.trim().substring(0, 10));
        } catch (RuntimeException ex) {
            throw new BadRequestException("INVALID_EXAM_TIME", "Ngay thi khong hop le.");
        }
    }

    private static LocalTime parseTime(String value) {
        if (isBlank(value)) {
            throw new BadRequestException("INVALID_EXAM_TIME", "Gio thi bat buoc.");
        }
        String normalized = value.trim();
        try {
            return LocalTime.parse(normalized.length() == 5 ? normalized : normalized.substring(0, 8));
        } catch (DateTimeParseException | IndexOutOfBoundsException ex) {
            throw new BadRequestException("INVALID_EXAM_TIME", "Gio thi khong hop le.");
        }
    }
}
