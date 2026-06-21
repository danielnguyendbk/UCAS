package com.ptit.qlphonghoc.admin.timetableimport.service;

import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewMessage;
import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewResponse;
import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewRow;
import com.ptit.qlphonghoc.admin.timetableimport.parser.ParsedImportFile;
import com.ptit.qlphonghoc.admin.timetableimport.parser.TimetableImportFileParser;
import com.ptit.qlphonghoc.admin.timetableimport.parser.TimetableImportParser;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportDataSource;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.*;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableMutationGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TimetableImportPreviewService {

    private static final Set<String> DAYS = Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");
    private static final Set<String> SESSION_TYPES = Set.of("THEORY", "PRACTICE");
    private static final Set<String> ROOM_TYPES = Set.of("LECTURE", "LAB", "SEMINAR", "AUDITORIUM");

    private final TimetableImportParser parser;
    private final TimetableImportDataSource repository;

    public TimetableImportPreviewService(TimetableImportParser parser, TimetableImportDataSource repository) {
        this.parser = parser;
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ImportPreviewResponse preview(MultipartFile file, Long semesterId, String semesterCode) {
        ParsedImportFile parsed = parser.parse(file);
        String inferredCode = firstNonBlank(parsed.rows(), "semester_code");
        String requestedCode = normalizeNullable(semesterCode);
        if (semesterId == null && requestedCode == null) requestedCode = normalizeNullable(inferredCode);
        if (semesterId == null && requestedCode == null) {
            throw new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Không xác định được học kỳ của file import.");
        }

        SemesterRef semester = repository.findSemester(semesterId, requestedCode)
                .orElseThrow(() -> new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Không tìm thấy học kỳ import."));
        assertMutable(semester);
        ReferenceData refs = repository.loadReferenceData(semester.id());

        Map<String, SectionRef> sections = refs.sections().stream().collect(Collectors.toMap(
                section -> section.courseId() + "|" + normalize(section.sectionCode()), Function.identity(), (a, b) -> a,
                LinkedHashMap::new
        ));
        Map<Long, List<ScheduleRef>> schedulesBySection = refs.schedules().stream()
                .collect(Collectors.groupingBy(ScheduleRef::sectionId, LinkedHashMap::new, Collectors.toList()));
        Set<String> rowSignatures = new LinkedHashSet<>();
        Set<String> sectionSignatures = new LinkedHashSet<>();
        Set<String> scheduleSignatures = new LinkedHashSet<>();
        List<ImportPreviewRow> resultRows = new ArrayList<>();

        for (int index = 0; index < parsed.rows().size(); index++) {
            Map<String, String> values = normalizeValues(parsed.rows().get(index));
            int rowNumber = parsed.rowNumbers().get(index);
            List<ImportPreviewMessage> messages = new ArrayList<>();

            String rowSemesterCode = value(values, "semester_code");
            String courseCode = value(values, "course_code");
            String sectionCode = value(values, "section_code");
            String className = value(values, "class_name");
            String lecturerCode = value(values, "lecturer_code");
            require(messages, rowSemesterCode, "semester_code");
            require(messages, courseCode, "course_code");
            require(messages, sectionCode, "section_code");
            require(messages, className, "class_name");
            require(messages, lecturerCode, "lecturer_code");
            if (!rowSemesterCode.isBlank() && !normalize(rowSemesterCode).equals(normalize(semester.code()))) {
                error(messages, "SEMESTER_NOT_FOUND", "Học kỳ của dòng không khớp học kỳ đang preview.");
            }

            CourseRef course = refs.courses().get(normalize(courseCode));
            if (!courseCode.isBlank() && course == null) error(messages, "COURSE_NOT_FOUND", "Môn học không tồn tại hoặc đã ngừng hoạt động.");
            LecturerRef lecturer = refs.lecturers().get(normalize(lecturerCode));
            if (!lecturerCode.isBlank() && lecturer == null) error(messages, "LECTURER_NOT_FOUND", "Giảng viên không tồn tại.");

            Integer enrolled = integer(values, "enrolled_count", messages, 0, null);
            Integer maximum = integer(values, "max_capacity", messages, 1, null);
            if (enrolled != null && maximum != null && enrolled > maximum) {
                error(messages, "INVALID_IMPORT_ROW", "enrolled_count không được lớn hơn max_capacity.");
            }
            String day = normalize(value(values, "day_of_week"));
            if (!DAYS.contains(day)) error(messages, "INVALID_IMPORT_ROW", "day_of_week phải là MON..SUN.");
            Integer slotStart = integer(values, "slot_start_no", messages, 1, null);
            Integer slotEnd = integer(values, "slot_end_no", messages, 1, null);
            if (slotStart != null && !refs.slots().containsKey(slotStart)) error(messages, "TIME_SLOT_NOT_FOUND", "Không tìm thấy tiết bắt đầu.");
            if (slotEnd != null && !refs.slots().containsKey(slotEnd)) error(messages, "TIME_SLOT_NOT_FOUND", "Không tìm thấy tiết kết thúc.");
            if (slotStart != null && slotEnd != null && slotStart > slotEnd) error(messages, "INVALID_IMPORT_ROW", "Khoảng tiết học không hợp lệ.");

            Integer fromWeek = optionalInteger(values, "from_week_no", messages, 1, null, null);
            Integer toWeek = optionalInteger(values, "to_week_no", messages, 1, null, null);
            if ((fromWeek == null) != (toWeek == null)) {
                error(messages, "INVALID_IMPORT_ROW", "from_week_no và to_week_no phải cùng có giá trị hoặc cùng để trống.");
            }
            if (fromWeek != null && toWeek != null && fromWeek > toWeek) error(messages, "INVALID_IMPORT_ROW", "Khoảng tuần học không hợp lệ.");
            WeekRange semesterWeeks = refs.weekRange();
            if (semesterWeeks == null) {
                error(messages, "INVALID_IMPORT_ROW", "Học kỳ chưa có cấu hình tuần học.");
            } else if ((fromWeek != null && fromWeek < semesterWeeks.minimum()) ||
                    (toWeek != null && toWeek > semesterWeeks.maximum())) {
                error(messages, "INVALID_IMPORT_ROW", "Khoảng tuần nằm ngoài học kỳ.");
            }

            String sessionType = normalize(value(values, "session_type"));
            if (!SESSION_TYPES.contains(sessionType)) error(messages, "INVALID_IMPORT_ROW", "session_type phải là THEORY hoặc PRACTICE.");
            Integer practiceGroup = optionalInteger(values, "practice_group_no", messages, 0, 255, 0);
            if (practiceGroup != null && "THEORY".equals(sessionType) && practiceGroup != 0) {
                error(messages, "INVALID_IMPORT_ROW", "Lịch lý thuyết phải có practice_group_no = 0.");
            }
            if (practiceGroup != null && "PRACTICE".equals(sessionType) && practiceGroup == 0) {
                error(messages, "INVALID_IMPORT_ROW", "Lịch thực hành phải có practice_group_no > 0.");
            }

            String suppliedRoomType = normalize(value(values, "required_room_type"));
            if (!suppliedRoomType.isBlank() && !ROOM_TYPES.contains(suppliedRoomType)) {
                error(messages, "INVALID_IMPORT_ROW", "required_room_type không hợp lệ.");
            }
            String requiredRoomType = suppliedRoomType.isBlank() && course != null ? normalize(course.requiredRoomType()) : suppliedRoomType;
            String buildingCode = value(values, "preferred_building_code");
            BuildingRef building = buildingCode.isBlank() ? null : refs.buildings().get(normalize(buildingCode));
            if (!buildingCode.isBlank() && (building == null || building.deleted())) {
                error(messages, "BUILDING_NOT_FOUND", "Tòa nhà ưu tiên không tồn tại hoặc đã bị xóa.");
            }
            String classroomCode = value(values, "preferred_classroom_code");
            ClassroomRef classroom = classroomCode.isBlank() ? null : refs.classrooms().get(normalize(classroomCode));
            if (!classroomCode.isBlank() && classroom == null) {
                error(messages, "CLASSROOM_NOT_FOUND", "Phòng học ưu tiên không tồn tại.");
            } else if (classroom != null) {
                if (!classroom.active() || classroom.deleted() || classroom.buildingDeleted()) {
                    error(messages, "INVALID_IMPORT_ROW", "Phòng học ưu tiên không hoạt động hoặc đã bị xóa.");
                }
                if (building != null && classroom.buildingId() != building.id()) {
                    error(messages, "INVALID_IMPORT_ROW", "Phòng học không thuộc tòa nhà ưu tiên.");
                }
                if (maximum != null && classroom.capacity() < maximum) {
                    error(messages, "INVALID_IMPORT_ROW", "Phòng học ưu tiên không đủ sức chứa.");
                }
                if (!requiredRoomType.isBlank() && !requiredRoomType.equals(normalize(classroom.roomType()))) {
                    error(messages, "INVALID_IMPORT_ROW", "Phòng học ưu tiên không đúng loại phòng yêu cầu.");
                }
            }

            String rowSignature = values.entrySet().stream().sorted(Map.Entry.comparingByKey())
                    .map(entry -> entry.getKey() + "=" + normalize(entry.getValue())).collect(Collectors.joining("|"));
            if (!rowSignatures.add(rowSignature)) error(messages, "DUPLICATE_IMPORT_ROW", "Dòng import bị trùng hoàn toàn trong file.");
            String sectionSignature = String.join("|", normalize(rowSemesterCode), normalize(courseCode), normalize(sectionCode));
            if (!sectionSignatures.add(sectionSignature)) {
                error(messages, "DUPLICATE_IMPORT_ROW", "Lớp học phần bị lặp trong file.");
            }
            String scheduleSignature = String.join("|", normalize(rowSemesterCode), normalize(courseCode), normalize(sectionCode),
                    day, string(slotStart), string(slotEnd), string(practiceGroup));
            if (!scheduleSignatures.add(scheduleSignature)) error(messages, "DUPLICATE_IMPORT_ROW", "Khóa lịch học bị trùng trong file.");

            SectionRef section = course == null ? null : sections.get(course.id() + "|" + normalize(sectionCode));
            ScheduleRef matchedSchedule = findSchedule(schedulesBySection.getOrDefault(section == null ? -1L : section.id(), List.of()),
                    day, slotStart, slotEnd, practiceGroup);
            if (classroom != null && isScheduleRangeValid(day, slotStart, slotEnd, fromWeek, toWeek)) {
                boolean occupied = refs.schedules().stream().anyMatch(existing ->
                        classroom.id() == (existing.classroomId() == null ? -1L : existing.classroomId())
                                && (matchedSchedule == null || existing.id() != matchedSchedule.id())
                                && !Set.of("CANCELLED", "INACTIVE").contains(normalize(existing.status()))
                                && day.equals(normalize(existing.dayOfWeek()))
                                && overlaps(slotStart.intValue(), slotEnd.intValue(), existing.slotStart(), existing.slotEnd())
                                && weekOverlaps(fromWeek, toWeek, existing.fromWeek(), existing.toWeek()));
                if (occupied) warning(messages, "ROOM_TIME_CONFLICT", "Phòng học ưu tiên đang trùng lịch trong khoảng tuần đã chọn.");
            }

            String operation = determineOperation(section, matchedSchedule, lecturer, enrolled, maximum, className,
                    day, slotStart, slotEnd, fromWeek, toWeek, sessionType, practiceGroup, classroom,
                    schedulesBySection.getOrDefault(section == null ? -1L : section.id(), List.of()));
            String status = messages.stream().anyMatch(message -> "ERROR".equals(message.severity())) ? "ERROR"
                    : messages.isEmpty() ? "VALID" : "WARNING";
            if ("ERROR".equals(status)) operation = "ERROR";
            String scheduleLabel = day + " " + string(slotStart) + "-" + string(slotEnd) + ", tuần "
                    + string(fromWeek) + "-" + string(toWeek);
            resultRows.add(new ImportPreviewRow(rowNumber, rowSemesterCode, courseCode, sectionCode, className,
                    lecturerCode, scheduleLabel, classroomCode, status, operation, List.copyOf(messages), Map.copyOf(values)));
        }

        Map<String, Integer> operations = countBy(resultRows, ImportPreviewRow::operation);
        Map<String, Integer> errors = resultRows.stream().flatMap(row -> row.messages().stream())
                .filter(message -> "ERROR".equals(message.severity()))
                .collect(Collectors.toMap(ImportPreviewMessage::code, message -> 1, Integer::sum, LinkedHashMap::new));
        int valid = (int) resultRows.stream().filter(row -> "VALID".equals(row.status())).count();
        int warnings = (int) resultRows.stream().filter(row -> "WARNING".equals(row.status())).count();
        int errorCount = (int) resultRows.stream().filter(row -> "ERROR".equals(row.status())).count();
        return new ImportPreviewResponse("PREVIEW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT),
                semester.id(), semester.code(), resultRows.size(), valid, warnings, errorCount,
                operations, errors, List.copyOf(resultRows));
    }

    private void assertMutable(SemesterRef semester) {
        if ("PUBLISHED".equals(normalize(semester.timetableStatus()))) {
            throw new BadRequestException(TimetableMutationGuard.PUBLISHED_ERROR_CODE, TimetableMutationGuard.PUBLISHED_MESSAGE);
        }
        if ("LOCKED".equals(normalize(semester.timetableStatus()))) {
            throw new BadRequestException(TimetableMutationGuard.LOCKED_ERROR_CODE, TimetableMutationGuard.LOCKED_MESSAGE);
        }
    }

    private String determineOperation(SectionRef section, ScheduleRef exactSchedule, LecturerRef lecturer,
                                      Integer enrolled, Integer maximum, String className, String day,
                                      Integer slotStart, Integer slotEnd, Integer fromWeek, Integer toWeek,
                                      String sessionType, Integer practiceGroup, ClassroomRef classroom,
                                      List<ScheduleRef> schedules) {
        if (section == null) return "CREATE_SECTION";
        boolean sectionChanged = lecturer != null && (section.lecturerId() != lecturer.id()
                || enrolled != null && section.enrolledCount() != enrolled
                || maximum != null && section.maxCapacity() != maximum
                || !normalize(section.className()).equals(normalize(className)));
        ScheduleRef candidate = exactSchedule;
        if (candidate == null) {
            candidate = schedules.stream().filter(schedule -> normalize(schedule.dayOfWeek()).equals(day)
                    && practiceGroup != null && schedule.practiceGroup() == practiceGroup).findFirst().orElse(null);
        }
        if (candidate == null) return "CREATE_SCHEDULE";
        boolean scheduleChanged = slotStart != null && candidate.slotStart() != slotStart
                || slotEnd != null && candidate.slotEnd() != slotEnd
                || !java.util.Objects.equals(candidate.fromWeek(), fromWeek)
                || !java.util.Objects.equals(candidate.toWeek(), toWeek)
                || !normalize(candidate.sessionType()).equals(sessionType)
                || classroom != null && !java.util.Objects.equals(candidate.classroomId(), classroom.id());
        if (scheduleChanged) return "UPDATE_SCHEDULE";
        return sectionChanged ? "UPDATE_SECTION" : "NO_CHANGE";
    }

    private ScheduleRef findSchedule(List<ScheduleRef> schedules, String day, Integer start, Integer end, Integer group) {
        if (start == null || end == null || group == null) return null;
        return schedules.stream().filter(schedule -> normalize(schedule.dayOfWeek()).equals(day)
                && schedule.slotStart() == start && schedule.slotEnd() == end && schedule.practiceGroup() == group)
                .findFirst().orElse(null);
    }

    private boolean isScheduleRangeValid(String day, Integer start, Integer end, Integer from, Integer to) {
        return DAYS.contains(day) && start != null && end != null && start <= end && from != null && to != null && from <= to;
    }

    private boolean overlaps(int aStart, int aEnd, int bStart, int bEnd) {
        return aStart <= bEnd && bStart <= aEnd;
    }

    private boolean weekOverlaps(Integer aStart, Integer aEnd, Integer bStart, Integer bEnd) {
        int as = aStart == null ? Integer.MIN_VALUE : aStart;
        int ae = aEnd == null ? Integer.MAX_VALUE : aEnd;
        int bs = bStart == null ? Integer.MIN_VALUE : bStart;
        int be = bEnd == null ? Integer.MAX_VALUE : bEnd;
        return as <= be && bs <= ae;
    }

    private Integer integer(Map<String, String> values, String field, List<ImportPreviewMessage> messages,
                            Integer minimum, Integer maximum) {
        String raw = value(values, field);
        if (raw.isBlank()) {
            error(messages, "INVALID_IMPORT_ROW", field + " không được để trống.");
            return null;
        }
        try {
            int value = raw.endsWith(".0") ? Integer.parseInt(raw.substring(0, raw.length() - 2)) : Integer.parseInt(raw);
            if (minimum != null && value < minimum || maximum != null && value > maximum) {
                error(messages, "INVALID_IMPORT_ROW", field + " nằm ngoài giới hạn cho phép.");
                return null;
            }
            return value;
        } catch (NumberFormatException exception) {
            error(messages, "INVALID_IMPORT_ROW", field + " phải là số nguyên.");
            return null;
        }
    }

    private Integer optionalInteger(Map<String, String> values, String field, List<ImportPreviewMessage> messages,
                                    Integer minimum, Integer maximum, Integer defaultValue) {
        if (value(values, field).isBlank()) return defaultValue;
        return integer(values, field, messages, minimum, maximum);
    }

    private void require(List<ImportPreviewMessage> messages, String value, String field) {
        if (value.isBlank()) error(messages, "INVALID_IMPORT_ROW", field + " không được để trống.");
    }

    private void error(List<ImportPreviewMessage> messages, String code, String message) {
        messages.add(new ImportPreviewMessage(code, "ERROR", message));
    }

    private void warning(List<ImportPreviewMessage> messages, String code, String message) {
        messages.add(new ImportPreviewMessage(code, "WARNING", message));
    }

    private Map<String, String> normalizeValues(Map<String, String> source) {
        Map<String, String> values = new LinkedHashMap<>();
        TimetableImportFileParser.HEADERS.forEach(header -> values.put(header, source.getOrDefault(header, "").trim()));
        return values;
    }

    private String firstNonBlank(List<Map<String, String>> rows, String key) {
        return rows.stream().map(row -> row.getOrDefault(key, "")).filter(value -> !value.isBlank()).findFirst().orElse(null);
    }

    private String value(Map<String, String> values, String key) {
        return values.getOrDefault(key, "").trim();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }

    private String string(Object value) {
        return value == null ? "?" : String.valueOf(value);
    }

    private <T> Map<String, Integer> countBy(List<T> values, Function<T, String> classifier) {
        return values.stream().map(classifier).sorted(Comparator.naturalOrder())
                .collect(Collectors.toMap(Function.identity(), item -> 1, Integer::sum, LinkedHashMap::new));
    }
}
