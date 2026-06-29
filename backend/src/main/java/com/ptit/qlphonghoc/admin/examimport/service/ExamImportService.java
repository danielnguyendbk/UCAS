package com.ptit.qlphonghoc.admin.examimport.service;

import com.ptit.qlphonghoc.admin.examimport.dto.ExamImportApplyResponse;
import com.ptit.qlphonghoc.admin.examimport.dto.ExamImportPreviewResponse;
import com.ptit.qlphonghoc.admin.examimport.dto.ExamImportRowResult;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ExamImportService {

    public static final List<String> HEADERS = List.of(
            "section_code", "exam_date", "start_time", "end_time",
            "classroom_code", "main_proctor_code", "assistant_proctor_code",
            "exam_type", "exam_method", "note"
    );

    private static final List<String> REQUIRED_HEADERS = List.of(
            "section_code", "exam_date", "start_time", "end_time", "exam_type"
    );

    private static final Map<String, List<String>> HEADER_ALIASES = Map.of(
            "section_code", List.of("section_code", "section", "class_section", "class_code", "ma_lop", "ma_nhom", "lop_nhom"),
            "exam_date", List.of("exam_date", "date", "ngay_thi", "ngay"),
            "start_time", List.of("start_time", "time_start", "gio_bat_dau", "bat_dau"),
            "end_time", List.of("end_time", "time_end", "gio_ket_thuc", "ket_thuc"),
            "classroom_code", List.of("classroom_code", "room_code", "phong_thi", "ma_phong", "phong"),
            "main_proctor_code", List.of("main_proctor_code", "proctor_code", "lecturer_code", "giam_thi_chinh", "ma_giam_thi_chinh"),
            "assistant_proctor_code", List.of("assistant_proctor_code", "assistant_code", "giam_thi_phu", "ma_giam_thi_phu"),
            "exam_type", List.of("exam_type", "type", "loai_thi"),
            "exam_method", List.of("exam_method", "method", "hinh_thuc_thi"),
            "note", List.of("note", "ghi_chu")
    );

    private static final Set<String> EXAM_TYPES = Set.of("MIDTERM", "FINAL", "MAKEUP", "OTHER");
    private static final Set<String> EXAM_METHODS = Set.of("WRITTEN", "ORAL", "PRACTICAL", "ONLINE");
    private static final Set<String> OVERWRITABLE_STATUSES = Set.of("DRAFT", "NEEDS_ROOM", "ROOM_ASSIGNED");
    private static final Set<String> READ_ONLY_WORKFLOW_STATUSES = Set.of("PUBLISHED", "LOCKED");

    private final NamedParameterJdbcTemplate jdbc;

    public ExamImportService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public ExamImportPreviewResponse preview(MultipartFile file, Long semesterId, String importMode) {
        ExamImportMode mode = ExamImportMode.from(importMode);
        List<ExamImportRowResult> rows = parseAndValidate(file, semesterId, mode);
        int valid = (int) rows.stream().filter(r -> "VALID".equals(r.status())).count();
        int warnings = (int) rows.stream().filter(r -> "WARNING".equals(r.status())).count();
        int errors = (int) rows.stream().filter(r -> "ERROR".equals(r.status())).count();
        return new ExamImportPreviewResponse(rows, rows.size(), valid, warnings, errors);
    }

    @Transactional
    public ExamImportApplyResponse apply(MultipartFile file, Long semesterId, Integer adminUserId, String importMode) {
        ExamImportMode mode = ExamImportMode.from(importMode);
        List<ExamImportRowResult> rows = parseAndValidate(file, semesterId, mode);
        List<String> errors = collectRowErrors(rows);

        if (rows.isEmpty()) {
            return new ExamImportApplyResponse(0, 0, 1, List.of("File import không có dòng dữ liệu hợp lệ."));
        }

        if (!errors.isEmpty()) {
            return new ExamImportApplyResponse(0, 0, errors.size(), errors);
        }

        assertSemesterImportable(semesterId);

        String batchCode = "EXAM-IMPORT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        int inserted = 0;
        int updated = 0;
        Set<Long> fileExamIds = new LinkedHashSet<>();

        try {
            for (ExamImportRowResult row : rows) {
                Long sectionId = resolveSectionId(row.sectionCode(), semesterId);
                Long classroomId = resolveClassroomId(row.classroomCode());
                String examStatus = classroomId == null ? "NEEDS_ROOM" : "ROOM_ASSIGNED";

                Long mainProctorId = resolveLecturerId(row.mainProctorCode());
                Long assistantProctorId = resolveLecturerId(row.assistantProctorCode());

                if ("UPDATE".equals(row.operation())) {
                    Long examId = row.existingExamId();

                    if (examId == null) {
                        throw new BadRequestException(
                                "EXAM_IMPORT_APPLY_FAILED",
                                "Không tìm thấy lịch thi để cập nhật ở dòng " + row.rowNumber()
                        );
                    }

                    jdbc.update("""
                            UPDATE exams
                            SET classroom_id = :classroomId,
                                proctor_lecturer_id = :mainProctorId,
                                exam_type = :examType,
                                exam_method = :examMethod,
                                exam_date = :examDate,
                                start_time = :startTime,
                                end_time = :endTime,
                                status = :status,
                                note = :note,
                                validation_status = 'NOT_CHECKED',
                                conflict_reason = NULL,
                                published_at = NULL,
                                updated_at = NOW()
                            WHERE exam_id = :examId
                            """, new MapSqlParameterSource()
                            .addValue("examId", examId)
                            .addValue("classroomId", classroomId)
                            .addValue("mainProctorId", mainProctorId)
                            .addValue("examType", row.examType().toUpperCase(Locale.ROOT))
                            .addValue("examMethod", row.examMethod() != null ? row.examMethod().toUpperCase(Locale.ROOT) : null)
                            .addValue("examDate", row.examDate())
                            .addValue("startTime", row.startTime())
                            .addValue("endTime", row.endTime())
                            .addValue("status", examStatus)
                            .addValue("note", row.note()));

                    replaceInvigilators(examId, mainProctorId, assistantProctorId);
                    fileExamIds.add(examId);
                    updated++;
                } else {
                    GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();

                    jdbc.update("""
                            INSERT INTO exams (
                                semester_id,
                                section_id,
                                classroom_id,
                                proctor_lecturer_id,
                                exam_type,
                                exam_method,
                                exam_date,
                                start_time,
                                end_time,
                                status,
                                validation_status,
                                conflict_reason,
                                note
                            )
                            VALUES (
                                :semesterId,
                                :sectionId,
                                :classroomId,
                                :mainProctorId,
                                :examType,
                                :examMethod,
                                :examDate,
                                :startTime,
                                :endTime,
                                :status,
                                'NOT_CHECKED',
                                NULL,
                                :note
                            )
                            """, new MapSqlParameterSource()
                                    .addValue("semesterId", semesterId)
                                    .addValue("sectionId", sectionId)
                                    .addValue("classroomId", classroomId)
                                    .addValue("mainProctorId", mainProctorId)
                                    .addValue("examType", row.examType().toUpperCase(Locale.ROOT))
                                    .addValue("examMethod", row.examMethod() != null ? row.examMethod().toUpperCase(Locale.ROOT) : null)
                                    .addValue("examDate", row.examDate())
                                    .addValue("startTime", row.startTime())
                                    .addValue("endTime", row.endTime())
                                    .addValue("status", examStatus)
                                    .addValue("note", row.note()),
                            keyHolder,
                            new String[]{"exam_id"});

                    long examId = keyHolder.getKey().longValue();
                    replaceInvigilators(examId, mainProctorId, assistantProctorId);
                    fileExamIds.add(examId);
                    inserted++;
                }
            }

            if (mode == ExamImportMode.SYNC_FILE_SCOPE) {
                softCancelExamsOutsideFileScope(semesterId, fileExamIds, batchCode);
            }

            markExamWorkflowDraft(semesterId);

            return new ExamImportApplyResponse(inserted, updated, 0, List.of());
        } catch (BadRequestException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadRequestException(
                    "EXAM_IMPORT_APPLY_FAILED",
                    "Không thể áp dụng file import lịch thi. Toàn bộ thay đổi đã được rollback.",
                    Map.of("reason", exception.getMessage() == null ? exception.getClass().getSimpleName() : exception.getMessage())
            );
        }
    }

    private List<ExamImportRowResult> parseAndValidate(MultipartFile file, Long semesterId, ExamImportMode importMode) {
        List<ExamImportRowResult> results = new ArrayList<>();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);

            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
                return results;
            }

            DataFormatter fmt = new DataFormatter();
            Map<String, Integer> headerMap = buildHeaderMap(sheet.getRow(0), fmt);
            List<String> missingHeaders = REQUIRED_HEADERS.stream()
                    .filter(header -> findColumn(headerMap, header) == null)
                    .toList();

            if (!missingHeaders.isEmpty()) {
                throw new RuntimeException("File import thiếu cột bắt buộc: "
                        + String.join(", ", missingHeaders)
                        + ". Các cột đọc được: "
                        + String.join(", ", headerMap.keySet()));
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);

                if (row == null || isBlankRow(row, fmt)) {
                    continue;
                }

                results.add(validateRow(i + 1, readValues(row, headerMap, fmt), semesterId, importMode));
            }
        } catch (Exception ex) {
            throw new RuntimeException("Không đọc được file import: " + ex.getMessage(), ex);
        }

        return results;
    }

    private ExamImportRowResult validateRow(int rowNum, Map<String, String> v, Long semesterId, ExamImportMode importMode) {
        List<String> errors = new ArrayList<>();

        String sectionCode = v.get("section_code");
        String examDateStr = v.get("exam_date");
        String startTimeStr = v.get("start_time");
        String endTimeStr = v.get("end_time");
        String classroomCode = v.get("classroom_code");
        String mainProctorCode = nullIfBlank(v.get("main_proctor_code"));
        String assistantProctorCode = nullIfBlank(v.get("assistant_proctor_code"));
        String examType = nullIfBlank(v.get("exam_type"));
        String examMethod = nullIfBlank(v.get("exam_method"));
        String note = nullIfBlank(v.get("note"));

        Long sectionId = null;

        if (isBlank(sectionCode)) {
            errors.add("section_code bắt buộc");
        } else {
            sectionId = resolveSectionId(sectionCode, semesterId);

            if (sectionId == null) {
                errors.add("Không tìm thấy học phần trong học kỳ đang import: " + sectionCode);
            }
        }

        LocalDate examDate = null;
        LocalTime startTime = null;
        LocalTime endTime = null;

        if (isBlank(examDateStr)) {
            errors.add("exam_date bắt buộc (định dạng YYYY-MM-DD)");
        } else {
            try {
                examDate = LocalDate.parse(examDateStr.trim());
            } catch (DateTimeParseException ex) {
                errors.add("exam_date không đúng định dạng: " + examDateStr);
            }
        }

        if (isBlank(startTimeStr)) {
            errors.add("start_time bắt buộc (định dạng HH:MM)");
        } else {
            try {
                startTime = parseTime(startTimeStr);
            } catch (DateTimeParseException ex) {
                errors.add("start_time không đúng định dạng: " + startTimeStr);
            }
        }

        if (isBlank(endTimeStr)) {
            errors.add("end_time bắt buộc (định dạng HH:MM)");
        } else {
            try {
                endTime = parseTime(endTimeStr);
            } catch (DateTimeParseException ex) {
                errors.add("end_time không đúng định dạng: " + endTimeStr);
            }
        }

        if (startTime != null && endTime != null && !endTime.isAfter(startTime)) {
            errors.add("end_time phải sau start_time");
        }

        Long classroomId = null;
        boolean missingRoom = isBlank(classroomCode);

        if (!missingRoom) {
            classroomId = resolveClassroomId(classroomCode);

            if (classroomId == null) {
                errors.add("Không tìm thấy phòng: " + classroomCode);
            }
        }

        Long mainProctorId = null;

        if (mainProctorCode != null) {
            mainProctorId = resolveLecturerId(mainProctorCode);

            if (mainProctorId == null) {
                errors.add("Không tìm thấy giám thị chính: " + mainProctorCode);
            }
        }

        Long assistantProctorId = null;

        if (assistantProctorCode != null) {
            assistantProctorId = resolveLecturerId(assistantProctorCode);

            if (assistantProctorId == null) {
                errors.add("Không tìm thấy giám thị phụ: " + assistantProctorCode);
            }
        }

        if (mainProctorId != null && assistantProctorId != null && mainProctorId.equals(assistantProctorId)) {
            errors.add("Giám thị chính và giám thị phụ không được trùng nhau");
        }

        if (isBlank(examType)) {
            errors.add("exam_type bắt buộc (MIDTERM/FINAL/MAKEUP/OTHER)");
        } else if (!EXAM_TYPES.contains(examType.toUpperCase(Locale.ROOT))) {
            errors.add("exam_type không hợp lệ: " + examType);
        }

        if (examMethod != null && !EXAM_METHODS.contains(examMethod.toUpperCase(Locale.ROOT))) {
            errors.add("exam_method không hợp lệ: " + examMethod);
        }

        if (!errors.isEmpty()) {
            return makeRow(rowNum, sectionCode, examDateStr, startTimeStr, endTimeStr,
                    classroomCode, mainProctorCode, assistantProctorCode, examType, examMethod, note,
                    "ERROR", "ERROR", errors, null);
        }

        Long existingExamId = null;

        if (sectionId != null && examType != null && examDate != null && startTime != null && endTime != null) {
            List<Map<String, Object>> existing = findExistingExam(
                    semesterId,
                    sectionId,
                    examType,
                    examDate,
                    startTime,
                    endTime
            );

            if (!existing.isEmpty()) {
                String existingStatus = String.valueOf(existing.get(0).get("status"));
                Long foundId = toLong(existing.get(0).get("exam_id"));

                if (OVERWRITABLE_STATUSES.contains(existingStatus)) {
                    existingExamId = foundId;
                } else {
                    errors.add("Không thể cập nhật lịch thi " + examType + " học phần " + sectionCode
                            + " vì trạng thái hiện tại là " + existingStatus);
                }
            }
        }

        if (!errors.isEmpty()) {
            return makeRow(rowNum, sectionCode, examDateStr, startTimeStr, endTimeStr,
                    classroomCode, mainProctorCode, assistantProctorCode, examType, examMethod, note,
                    "ERROR", "ERROR", errors, null);
        }

        if (classroomId != null && examDate != null && startTime != null && endTime != null) {
            String sameSemesterFilter = importMode == ExamImportMode.SYNC_FILE_SCOPE
                    ? " AND semester_id <> :semesterId"
                    : "";
            String sql = """
                    SELECT COUNT(*)
                    FROM exams
                    WHERE classroom_id = :roomId
                      AND exam_date = :date
                      AND status NOT IN ('CANCELLED','COMPLETED')
                      %s
                      AND NOT (end_time <= :startTime OR start_time >= :endTime)
                    """.formatted(sameSemesterFilter)
                    + (existingExamId != null ? " AND exam_id != :excludeId" : "");

            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("roomId", classroomId)
                    .addValue("semesterId", semesterId)
                    .addValue("date", examDate.toString())
                    .addValue("startTime", startTime.toString())
                    .addValue("endTime", endTime.toString());

            if (existingExamId != null) {
                params.addValue("excludeId", existingExamId);
            }

            Integer count = jdbc.queryForObject(sql, params, Integer.class);

            if (count != null && count > 0) {
                errors.add("Phòng " + classroomCode + " đã có lịch thi trùng giờ ngày " + examDate);
            }
        }

        if (mainProctorId != null && examDate != null && startTime != null && endTime != null) {
            String sameSemesterFilter = importMode == ExamImportMode.SYNC_FILE_SCOPE
                    ? " AND e.semester_id <> :semesterId"
                    : "";
            String examSql = """
                    SELECT COUNT(*)
                    FROM exams e
                    JOIN exam_invigilators ei ON ei.exam_id = e.exam_id
                    WHERE ei.lecturer_id = :proctorId
                      AND e.exam_date = :date
                      AND e.status NOT IN ('CANCELLED','COMPLETED')
                      %s
                      AND NOT (e.end_time <= :startTime OR e.start_time >= :endTime)
                    """.formatted(sameSemesterFilter)
                    + (existingExamId != null ? " AND e.exam_id != :excludeId" : "");

            MapSqlParameterSource examParams = new MapSqlParameterSource()
                    .addValue("proctorId", mainProctorId)
                    .addValue("semesterId", semesterId)
                    .addValue("date", examDate.toString())
                    .addValue("startTime", startTime.toString())
                    .addValue("endTime", endTime.toString());

            if (existingExamId != null) {
                examParams.addValue("excludeId", existingExamId);
            }

            Integer examConflictCount = jdbc.queryForObject(examSql, examParams, Integer.class);

            if (examConflictCount != null && examConflictCount > 0) {
                errors.add("Giám thị chính " + mainProctorCode + " đã có lịch gác thi trùng giờ");
            }

            Integer teachingConflictCount = jdbc.queryForObject("""
                    SELECT COUNT(*)
                    FROM class_sessions
                    WHERE lecturer_id = :proctorId
                      AND session_date = :date
                      AND session_status NOT IN ('CANCELLED','RESCHEDULED')
                      AND NOT (end_time <= :startTime OR start_time >= :endTime)
                    """, Map.of(
                    "proctorId", mainProctorId,
                    "date", examDate.toString(),
                    "startTime", startTime.toString(),
                    "endTime", endTime.toString()
            ), Integer.class);

            if (teachingConflictCount != null && teachingConflictCount > 0) {
                errors.add("Giám thị chính " + mainProctorCode + " đang có buổi dạy trùng giờ thi");
            }
        }

        if (!errors.isEmpty()) {
            return makeRow(rowNum, sectionCode, examDateStr, startTimeStr, endTimeStr,
                    classroomCode, mainProctorCode, assistantProctorCode, examType, examMethod, note,
                    "ERROR", "ERROR", errors, null);
        }

        String operation = existingExamId != null ? "UPDATE" : "CREATE";
        List<String> messages = new ArrayList<>();

        if ("UPDATE".equals(operation)) {
            messages.add("Sẽ cập nhật lịch thi hiện có");
        }

        if (missingRoom) {
            messages.add("Chưa có phòng thi, Staff sẽ phân phòng sau khi import");
        }


        String status = messages.isEmpty() ? "VALID" : "WARNING";

        return makeRow(rowNum, sectionCode, examDateStr, startTimeStr, endTimeStr,
                classroomCode, mainProctorCode, assistantProctorCode, examType, examMethod, note,
                operation, status, messages, existingExamId);
    }

    private List<String> collectRowErrors(List<ExamImportRowResult> rows) {
        List<String> errors = new ArrayList<>();

        for (ExamImportRowResult row : rows) {
            if ("ERROR".equals(row.status())) {
                errors.add("Dòng " + row.rowNumber() + ": " + String.join("; ", row.messages()));
            }
        }

        return errors;
    }

    private List<Map<String, Object>> findExistingExam(
            Long semesterId,
            Long sectionId,
            String examType,
            LocalDate examDate,
            LocalTime startTime,
            LocalTime endTime
    ) {
        String normalizedType = examType.toUpperCase(Locale.ROOT);

        if ("MIDTERM".equals(normalizedType) || "FINAL".equals(normalizedType)) {
            return jdbc.queryForList("""
                    SELECT exam_id, status
                    FROM exams
                    WHERE section_id = :sectionId
                      AND semester_id = :semesterId
                      AND exam_type = :examType
                      AND status != 'CANCELLED'
                    LIMIT 1
                    """, Map.of(
                    "sectionId", sectionId,
                    "semesterId", semesterId,
                    "examType", normalizedType
            ));
        }

        return jdbc.queryForList("""
                SELECT exam_id, status
                FROM exams
                WHERE section_id = :sectionId
                  AND semester_id = :semesterId
                  AND exam_type = :examType
                  AND exam_date = :examDate
                  AND start_time = :startTime
                  AND end_time = :endTime
                  AND status != 'CANCELLED'
                LIMIT 1
                """, Map.of(
                "sectionId", sectionId,
                "semesterId", semesterId,
                "examType", normalizedType,
                "examDate", examDate.toString(),
                "startTime", startTime.toString(),
                "endTime", endTime.toString()
        ));
    }

    private void replaceInvigilators(Long examId, Long mainProctorId, Long assistantProctorId) {
        jdbc.update("DELETE FROM exam_invigilators WHERE exam_id = :examId", Map.of("examId", examId));

        if (mainProctorId != null) {
            jdbc.update("""
                    INSERT INTO exam_invigilators (exam_id, lecturer_id, role)
                    VALUES (:examId, :lecturerId, 'MAIN')
                    ON DUPLICATE KEY UPDATE role = VALUES(role)
                    """, Map.of("examId", examId, "lecturerId", mainProctorId));
        }

        if (assistantProctorId != null) {
            jdbc.update("""
                    INSERT INTO exam_invigilators (exam_id, lecturer_id, role)
                    VALUES (:examId, :lecturerId, 'ASSISTANT')
                    ON DUPLICATE KEY UPDATE role = VALUES(role)
                    """, Map.of("examId", examId, "lecturerId", assistantProctorId));
        }
    }

    private int softCancelExamsOutsideFileScope(Long semesterId, Set<Long> fileExamIds, String batchCode) {
        String cancelNote = "Soft-cancelled by exam import " + batchCode + " (SYNC_FILE_SCOPE)";

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("semesterId", semesterId)
                .addValue("cancelNote", cancelNote);

        if (fileExamIds == null || fileExamIds.isEmpty()) {
            return jdbc.update("""
                    UPDATE exams
                    SET status = 'CANCELLED',
                        validation_status = 'NOT_CHECKED',
                        conflict_reason = NULL,
                        note = CASE
                            WHEN note IS NULL OR note = '' THEN :cancelNote
                            ELSE CONCAT(note, '\n', :cancelNote)
                        END,
                        updated_at = NOW()
                    WHERE semester_id = :semesterId
                      AND status NOT IN ('CANCELLED','COMPLETED')
                    """, params);
        }

        params.addValue("fileExamIds", fileExamIds);

        return jdbc.update("""
                UPDATE exams
                SET status = 'CANCELLED',
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL,
                    note = CASE
                        WHEN note IS NULL OR note = '' THEN :cancelNote
                        ELSE CONCAT(note, '\n', :cancelNote)
                    END,
                    updated_at = NOW()
                WHERE semester_id = :semesterId
                  AND status NOT IN ('CANCELLED','COMPLETED')
                  AND exam_id NOT IN (:fileExamIds)
                """, params);
    }

    private void assertSemesterImportable(Long semesterId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT exam_workflow_status
                FROM semesters
                WHERE semester_id = :semesterId
                  AND is_deleted = FALSE
                FOR UPDATE
                """, Map.of("semesterId", semesterId));

        if (rows.isEmpty()) {
            throw new BadRequestException("SEMESTER_NOT_FOUND", "Không tìm thấy học kỳ import.");
        }

        String status = String.valueOf(rows.get(0).get("exam_workflow_status"));

        if (READ_ONLY_WORKFLOW_STATUSES.contains(status)) {
            throw new BadRequestException(
                    "EXAM_TIMETABLE_READ_ONLY",
                    "Lịch thi đã công bố hoặc đã khóa, cần mở lại workflow trước khi import."
            );
        }
    }

    private void markExamWorkflowDraft(Long semesterId) {
        jdbc.update("""
                UPDATE semesters
                SET exam_workflow_status = 'DRAFT'
                WHERE semester_id = :semesterId
                """, Map.of("semesterId", semesterId));
    }

    private Long resolveSectionId(String sectionCode, Long semesterId) {
        if (isBlank(sectionCode)) {
            return null;
        }

        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT section_id
                FROM class_sections
                WHERE section_code = :code
                  AND semester_id = :semesterId
                  AND status <> 'CANCELLED'
                LIMIT 1
                """, Map.of("code", sectionCode, "semesterId", semesterId));

        if (rows.isEmpty()) {
            return null;
        }

        return toLong(rows.get(0).values().iterator().next());
    }

    private Long resolveClassroomId(String classroomCode) {
        if (isBlank(classroomCode)) {
            return null;
        }

        return resolveId("""
                SELECT classroom_id
                FROM classrooms
                WHERE classroom_code = :code
                  AND is_deleted = FALSE
                  AND is_active = TRUE
                LIMIT 1
                """, classroomCode);
    }

    private Long resolveLecturerId(String lecturerCode) {
        if (isBlank(lecturerCode)) {
            return null;
        }

        return resolveId("""
                SELECT lecturer_id
                FROM lecturers
                WHERE lecturer_code = :code
                  AND is_deleted = FALSE
                LIMIT 1
                """, lecturerCode);
    }

    private static LocalTime parseTime(String value) {
        String normalized = value.trim();

        if (normalized.length() == 5) {
            return LocalTime.parse(normalized);
        }

        return LocalTime.parse(normalized.length() > 8 ? normalized.substring(0, 8) : normalized);
    }

    private ExamImportRowResult makeRow(
            int rowNum,
            String sectionCode,
            String examDate,
            String startTime,
            String endTime,
            String classroomCode,
            String mainProctorCode,
            String assistantProctorCode,
            String examType,
            String examMethod,
            String note,
            String operation,
            String status,
            List<String> messages,
            Long existingExamId
    ) {
        return new ExamImportRowResult(
                rowNum,
                sectionCode,
                examDate,
                startTime,
                endTime,
                classroomCode,
                mainProctorCode,
                assistantProctorCode,
                examType,
                examMethod,
                note,
                operation,
                status,
                messages,
                existingExamId
        );
    }

    private Long resolveId(String sql, String code) {
        if (isBlank(code)) {
            return null;
        }

        List<Map<String, Object>> rows = jdbc.queryForList(sql, Map.of("code", code));

        if (rows.isEmpty()) {
            return null;
        }

        return toLong(rows.get(0).values().iterator().next());
    }

    private static Long toLong(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.longValue();
        }

        String text = String.valueOf(value).trim();

        return text.isEmpty() ? null : Long.parseLong(text);
    }

    private Map<String, Integer> buildHeaderMap(Row headerRow, DataFormatter fmt) {
        Map<String, Integer> map = new LinkedHashMap<>();

        if (headerRow == null) {
            return map;
        }

        for (int c = 0; c < headerRow.getLastCellNum(); c++) {
            String header = normalizeHeader(fmt.formatCellValue(headerRow.getCell(c)));

            if (!header.isBlank()) {
                map.put(header, c);
            }
        }

        return map;
    }

    private Map<String, String> readValues(Row row, Map<String, Integer> headerMap, DataFormatter fmt) {
        Map<String, String> values = new LinkedHashMap<>();

        for (String header : HEADERS) {
            Integer col = findColumn(headerMap, header);
            String value = col == null ? null : fmt.formatCellValue(row.getCell(col)).trim();
            values.put(header, isBlank(value) ? null : value);
        }

        return values;
    }

    private static Integer findColumn(Map<String, Integer> headerMap, String canonicalHeader) {
        Integer direct = headerMap.get(normalizeHeader(canonicalHeader));

        if (direct != null) {
            return direct;
        }

        for (String alias : HEADER_ALIASES.getOrDefault(canonicalHeader, List.of(canonicalHeader))) {
            Integer col = headerMap.get(normalizeHeader(alias));

            if (col != null) {
                return col;
            }
        }

        return null;
    }

    private static String normalizeHeader(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\uFEFF", "")
                .replace("\u00A0", " ")
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\s\\-]+", "_");
    }

    private boolean isBlankRow(Row row, DataFormatter fmt) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            if (!fmt.formatCellValue(row.getCell(c)).isBlank()) {
                return false;
            }
        }

        return true;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String nullIfBlank(String value) {
        return isBlank(value) ? null : value;
    }

    private enum ExamImportMode {
        MERGE,
        SYNC_FILE_SCOPE;

        private static ExamImportMode from(String mode) {
            if (mode == null || mode.isBlank()) {
                return MERGE;
            }

            String normalized = mode.trim().toUpperCase(Locale.ROOT);

            return switch (normalized) {
                case "SYNC_FILE_SCOPE", "OVERWRITE", "REPLACE", "FULL_REPLACE" -> SYNC_FILE_SCOPE;
                case "MERGE", "UPSERT", "APPEND" -> MERGE;
                default -> MERGE;
            };
        }
    }
}
