package com.ptit.qlphonghoc.admin.timetableimport.service;

import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportApplyResponse;
import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewResponse;
import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewRow;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.*;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportWriteStore;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportWriteStore.ScheduleWrite;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportWriteStore.SectionWrite;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableMutationGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TimetableImportApplyService {

    private final TimetableImportValidator validator;
    private final TimetableImportWriteStore writeStore;
    private final TimetableImportAuditLogger auditLogger;

    public TimetableImportApplyService(
            TimetableImportValidator validator,
            TimetableImportWriteStore writeStore,
            TimetableImportAuditLogger auditLogger
    ) {
        this.validator = validator;
        this.writeStore = writeStore;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public ImportApplyResponse apply(MultipartFile file, Long semesterId, String semesterCode, Integer userId) {
        TimetableImportValidationResult validation = validator.validate(file, semesterId, semesterCode);
        ImportPreviewResponse preview = validation.preview();
        if (preview.errorRows() > 0) {
            throw new BadRequestException(
                    "IMPORT_HAS_ERRORS",
                    "File import còn dòng lỗi. Không có dữ liệu nào được ghi.",
                    validationErrorDetails(preview)
            );
        }

        SemesterRef lockedSemester = writeStore.lockSemester(validation.semester().id())
                .orElseThrow(() -> new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Không tìm thấy học kỳ import."));
        assertMutable(lockedSemester);

        String batchCode = "APPLY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        String source = importSource(file);
        ReferenceData refs = validation.referenceData();
        Map<String, SectionRef> sections = refs.sections().stream().collect(Collectors.toMap(
                section -> section.courseId() + "|" + normalize(section.sectionCode()),
                Function.identity(), (left, right) -> left, LinkedHashMap::new
        ));
        Map<Long, List<ScheduleRef>> schedules = refs.schedules().stream()
                .collect(Collectors.groupingBy(ScheduleRef::sectionId, LinkedHashMap::new, Collectors.toList()));
        Counters counters = new Counters();

        try {
            for (ImportPreviewRow row : preview.rows()) {
                try {
                    applyRow(row, lockedSemester.id(), source, batchCode, refs, sections, schedules, counters);
                } catch (Exception exception) {
                    if (exception instanceof BadRequestException badRequestException) throw badRequestException;
                    if (exception instanceof DuplicateKeyException) {
                        throw new BadRequestException(
                                "IMPORT_CONFLICT",
                                "Dữ liệu đã thay đổi trong lúc import. Toàn bộ import đã được rollback.",
                                Map.of("rowNumber", row.rowNumber())
                        );
                    }
                    throw new BadRequestException(
                            "IMPORT_APPLY_FAILED",
                            "Không thể ghi dòng " + row.rowNumber() + ". Toàn bộ import đã được rollback.",
                            Map.of("rowNumber", row.rowNumber(), "reason", safeReason(exception))
                    );
                }
            }

            writeStore.markSemesterDraft(lockedSemester.id());
            ImportApplyResponse response = counters.toResponse(batchCode, lockedSemester, preview.totalRows());
            auditLogger.logTimetableImport(userId, lockedSemester.id(), batchCode, auditSummary(response, source));
            return response;
        } catch (BadRequestException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadRequestException(
                    "IMPORT_APPLY_FAILED",
                    "Không thể áp dụng file import. Toàn bộ thay đổi đã được rollback.",
                    Map.of("reason", safeReason(exception))
            );
        }
    }

    private void applyRow(
            ImportPreviewRow row,
            long semesterId,
            String source,
            String batchCode,
            ReferenceData refs,
            Map<String, SectionRef> sections,
            Map<Long, List<ScheduleRef>> schedules,
            Counters counters
    ) {
        Map<String, String> values = row.values();
        CourseRef course = refs.courses().get(normalize(values.get("course_code")));
        LecturerRef lecturer = refs.lecturers().get(normalize(values.get("lecturer_code")));
        String sectionKey = course.id() + "|" + normalize(values.get("section_code"));
        SectionRef existingSection = sections.get(sectionKey);
        SectionWrite sectionWrite = new SectionWrite(
                semesterId,
                course.id(),
                lecturer.id(),
                values.get("section_code"),
                values.get("class_name"),
                integer(values, "enrolled_count"),
                integer(values, "max_capacity"),
                source,
                batchCode
        );

        long sectionId;
        if (existingSection == null) {
            sectionId = writeStore.insertSection(sectionWrite);
            counters.createdSections++;
        } else {
            sectionId = existingSection.id();
            writeStore.updateSection(sectionId, sectionWrite);
            counters.updatedSections++;
        }

        int slotStartNo = integer(values, "slot_start_no");
        int slotEndNo = integer(values, "slot_end_no");
        int practiceGroup = optionalInteger(values, "practice_group_no", 0);
        SlotRef slotStart = refs.slots().get(slotStartNo);
        SlotRef slotEnd = refs.slots().get(slotEndNo);
        ScheduleRef existingSchedule = findSchedule(
                schedules.getOrDefault(sectionId, List.of()),
                values.get("day_of_week"), slotStartNo, slotEndNo, practiceGroup
        );

        String classroomCode = values.getOrDefault("preferred_classroom_code", "").trim();
        Long classroomId;
        if (!classroomCode.isBlank()) {
            classroomId = refs.classrooms().get(normalize(classroomCode)).id();
        } else if (existingSchedule != null) {
            classroomId = existingSchedule.classroomId();
            if (classroomId != null) counters.retainedClassroomAssignments++;
        } else {
            classroomId = null;
        }
        String scheduleStatus = classroomId == null ? "UNASSIGNED" : "ASSIGNED";
        ScheduleWrite scheduleWrite = new ScheduleWrite(
                sectionId,
                classroomId,
                normalize(values.get("day_of_week")),
                slotStart.id(),
                slotEnd.id(),
                slotStart.startTime(),
                slotEnd.endTime(),
                nullableInteger(values, "from_week_no"),
                nullableInteger(values, "to_week_no"),
                normalize(values.get("session_type")),
                practiceGroup,
                scheduleStatus
        );

        if (existingSchedule == null) {
            writeStore.insertSchedule(scheduleWrite);
            counters.createdSchedules++;
        } else {
            writeStore.updateSchedule(existingSchedule.id(), scheduleWrite);
            counters.updatedSchedules++;
        }
        if ("NO_CHANGE".equals(row.operation())) counters.unchangedRows++;
    }

    private ScheduleRef findSchedule(List<ScheduleRef> schedules, String day, int start, int end, int group) {
        return schedules.stream().filter(schedule -> normalize(schedule.dayOfWeek()).equals(normalize(day))
                && schedule.slotStart() == start
                && schedule.slotEnd() == end
                && schedule.practiceGroup() == group).findFirst().orElse(null);
    }

    private Map<String, Object> validationErrorDetails(ImportPreviewResponse preview) {
        List<Map<String, Object>> invalidRows = preview.rows().stream()
                .filter(row -> "ERROR".equals(row.status()))
                .map(row -> {
                    Map<String, Object> detail = new LinkedHashMap<>();
                    detail.put("rowNumber", row.rowNumber());
                    detail.put("courseCode", row.courseCode());
                    detail.put("sectionCode", row.sectionCode());
                    detail.put("messages", row.messages());
                    return detail;
                }).toList();
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("totalRows", preview.totalRows());
        details.put("errorRows", preview.errorRows());
        details.put("errorsByType", preview.errorsByType());
        details.put("rows", invalidRows);
        return details;
    }

    private Map<String, Object> auditSummary(ImportApplyResponse response, String source) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("importBatchCode", response.importBatchCode());
        summary.put("importSource", source);
        summary.put("semesterId", response.semesterId());
        summary.put("semesterCode", response.semesterCode());
        summary.put("totalRows", response.totalRows());
        summary.put("createdSections", response.createdSections());
        summary.put("updatedSections", response.updatedSections());
        summary.put("createdSchedules", response.createdSchedules());
        summary.put("updatedSchedules", response.updatedSchedules());
        summary.put("unchangedRows", response.unchangedRows());
        summary.put("retainedClassroomAssignments", response.retainedClassroomAssignments());
        summary.put("timetableStatus", response.timetableStatus());
        return summary;
    }

    private void assertMutable(SemesterRef semester) {
        String status = normalize(semester.timetableStatus());
        if ("PUBLISHED".equals(status)) {
            throw new BadRequestException(TimetableMutationGuard.PUBLISHED_ERROR_CODE, TimetableMutationGuard.PUBLISHED_MESSAGE);
        }
        if ("LOCKED".equals(status)) {
            throw new BadRequestException(TimetableMutationGuard.LOCKED_ERROR_CODE, TimetableMutationGuard.LOCKED_MESSAGE);
        }
    }

    private int integer(Map<String, String> values, String key) {
        return Integer.parseInt(values.get(key).replaceFirst("\\.0$", ""));
    }

    private int optionalInteger(Map<String, String> values, String key, int defaultValue) {
        String value = values.getOrDefault(key, "").trim();
        return value.isBlank() ? defaultValue : Integer.parseInt(value.replaceFirst("\\.0$", ""));
    }

    private Integer nullableInteger(Map<String, String> values, String key) {
        String value = values.getOrDefault(key, "").trim();
        return value.isBlank() ? null : Integer.valueOf(value.replaceFirst("\\.0$", ""));
    }

    private String importSource(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String source = filename == null || filename.isBlank() ? "TIMETABLE_IMPORT" : filename.trim();
        return source.length() <= 100 ? source : source.substring(0, 100);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String safeReason(Exception exception) {
        if (exception instanceof DataAccessException dataAccessException
                && dataAccessException.getMostSpecificCause() != null) {
            String databaseMessage = dataAccessException.getMostSpecificCause().getMessage();
            if (databaseMessage != null && !databaseMessage.isBlank()) return databaseMessage;
        }
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }

    private static class Counters {
        private int createdSections;
        private int updatedSections;
        private int createdSchedules;
        private int updatedSchedules;
        private int unchangedRows;
        private int retainedClassroomAssignments;

        private ImportApplyResponse toResponse(String batchCode, SemesterRef semester, int totalRows) {
            return new ImportApplyResponse(
                    batchCode,
                    semester.id(),
                    semester.code(),
                    totalRows,
                    createdSections,
                    updatedSections,
                    createdSchedules,
                    updatedSchedules,
                    unchangedRows,
                    0,
                    retainedClassroomAssignments,
                    "DRAFT"
            );
        }
    }
}
