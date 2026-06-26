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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
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
public class TimetableImportPreviewService implements TimetableImportValidator {

    private static final Set<String> DAYS = Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");
    private static final Set<String> SESSION_TYPES = Set.of("THEORY", "PRACTICE");
    private static final Set<String> ROOM_TYPES = Set.of("LECTURE", "LAB", "SEMINAR", "AUDITORIUM");
    private static final Set<String> INACTIVE_SCHEDULE_STATUSES = Set.of("CANCELLED", "INACTIVE");

    private final TimetableImportParser parser;
    private final TimetableImportDataSource repository;

    public TimetableImportPreviewService(TimetableImportParser parser, TimetableImportDataSource repository) {
        this.parser = parser;
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ImportPreviewResponse preview(MultipartFile file, Long semesterId, String semesterCode) {
        return validate(file, semesterId, semesterCode, null).preview();
    }

    @Transactional(readOnly = true)
    public ImportPreviewResponse preview(MultipartFile file, Long semesterId, String semesterCode, String mode) {
        return validate(file, semesterId, semesterCode, mode).preview();
    }

    @Override
    public TimetableImportValidationResult validate(MultipartFile file, Long semesterId, String semesterCode) {
        return validate(file, semesterId, semesterCode, null);
    }

    @Override
    public TimetableImportValidationResult validate(MultipartFile file, Long semesterId, String semesterCode, String mode) {
        TimetableImportMode importMode = TimetableImportMode.from(mode);
        ParsedImportFile parsed = parser.parse(file);
        String inferredCode = firstNonBlank(parsed.rows(), "semester_code");
        String requestedCode = normalizeNullable(semesterCode);
        if (semesterId == null && requestedCode == null) requestedCode = normalizeNullable(inferredCode);
        if (semesterId == null && requestedCode == null) {
            throw new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Khong xac dinh duoc hoc ky cua file import.");
        }

        SemesterRef semester = repository.findSemester(semesterId, requestedCode)
                .orElseThrow(() -> new ResourceNotFoundException("SEMESTER_NOT_FOUND", "Khong tim thay hoc ky import."));
        assertMutable(semester);
        ReferenceData refs = repository.loadReferenceData(semester.id());

        Map<String, SectionRef> sections = refs.sections().stream().collect(Collectors.toMap(
                section -> section.courseId() + "|" + normalize(section.sectionCode()), Function.identity(), (a, b) -> a,
                LinkedHashMap::new
        ));
        Map<Long, SectionRef> sectionsById = refs.sections().stream().collect(Collectors.toMap(
                SectionRef::id, Function.identity(), (a, b) -> a, LinkedHashMap::new
        ));
        Map<Long, List<ScheduleRef>> schedulesBySection = refs.schedules().stream()
                .collect(Collectors.groupingBy(ScheduleRef::sectionId, LinkedHashMap::new, Collectors.toList()));
        Set<String> rowSignatures = new LinkedHashSet<>();
        Set<String> sectionSignatures = new LinkedHashSet<>();
        Set<String> scheduleSignatures = new LinkedHashSet<>();
        List<ImportPreviewRow> resultRows = new ArrayList<>();
        List<ImportCandidate> fileCandidates = new ArrayList<>();

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
            maxLength(messages, rowSemesterCode, "semester_code", 50);
            maxLength(messages, courseCode, "course_code", 20);
            maxLength(messages, sectionCode, "section_code", 20);
            maxLength(messages, className, "class_name", 50);
            maxLength(messages, lecturerCode, "lecturer_code", 20);
            if (!rowSemesterCode.isBlank() && !normalize(rowSemesterCode).equals(normalize(semester.code()))) {
                error(messages, "SEMESTER_NOT_FOUND", "Hoc ky cua dong khong khop hoc ky dang preview.");
            }

            CourseRef course = refs.courses().get(normalize(courseCode));
            if (!courseCode.isBlank() && course == null) error(messages, "COURSE_NOT_FOUND", "Mon hoc khong ton tai hoac da ngung hoat dong.");
            LecturerRef lecturer = refs.lecturers().get(normalize(lecturerCode));
            if (!lecturerCode.isBlank() && lecturer == null) error(messages, "LECTURER_NOT_FOUND", "Giang vien khong ton tai.");
            if (!className.isBlank() && !refs.classes().containsKey(normalize(className))) {
                error(messages, "CLASS_NOT_FOUND", "Lop hanh chinh khong ton tai trong danh sach sinh vien.");
            }

            Integer enrolled = integer(values, "enrolled_count", messages, 0, null, "INVALID_IMPORT_ROW");
            Integer maximum = integer(values, "max_capacity", messages, 1, null, "INVALID_IMPORT_ROW");
            if (enrolled != null && maximum != null && enrolled > maximum) {
                error(messages, "INVALID_IMPORT_ROW", "enrolled_count khong duoc lon hon max_capacity.");
            }
            String day = normalize(value(values, "day_of_week"));
            if (!DAYS.contains(day)) error(messages, "INVALID_IMPORT_ROW", "day_of_week phai la MON..SUN.");
            Integer slotStart = integer(values, "slot_start_no", messages, 1, null, "INVALID_IMPORT_ROW");
            Integer slotEnd = integer(values, "slot_end_no", messages, 1, null, "INVALID_IMPORT_ROW");
            if (slotStart != null && !refs.slots().containsKey(slotStart)) error(messages, "TIME_SLOT_NOT_FOUND", "Khong tim thay tiet bat dau.");
            if (slotEnd != null && !refs.slots().containsKey(slotEnd)) error(messages, "TIME_SLOT_NOT_FOUND", "Khong tim thay tiet ket thuc.");
            if (slotStart != null && slotEnd != null && slotStart > slotEnd) error(messages, "INVALID_TIME_RANGE", "Khoang tiet hoc khong hop le.");

            Integer fromWeek = optionalInteger(values, "from_week_no", messages, 1, null, null, "INVALID_WEEK_RANGE");
            Integer toWeek = optionalInteger(values, "to_week_no", messages, 1, null, null, "INVALID_WEEK_RANGE");
            if ((fromWeek == null) != (toWeek == null)) {
                error(messages, "INVALID_WEEK_RANGE", "from_week_no va to_week_no phai cung co gia tri hoac cung de trong.");
            }
            if (fromWeek != null && toWeek != null && fromWeek > toWeek) error(messages, "INVALID_WEEK_RANGE", "Khoang tuan hoc khong hop le.");
            WeekRange semesterWeeks = refs.weekRange();
            if (semesterWeeks == null) {
                error(messages, "INVALID_WEEK_RANGE", "Hoc ky chua co cau hinh tuan hoc.");
            } else if ((fromWeek != null && fromWeek < semesterWeeks.minimum()) ||
                    (toWeek != null && toWeek > semesterWeeks.maximum())) {
                error(messages, "INVALID_WEEK_RANGE", "Khoang tuan nam ngoai hoc ky.");
            }

            String sessionType = normalize(value(values, "session_type"));
            if (!SESSION_TYPES.contains(sessionType)) error(messages, "INVALID_IMPORT_ROW", "session_type phai la THEORY hoac PRACTICE.");
            Integer practiceGroup = optionalInteger(values, "practice_group_no", messages, 0, 255, 0, "INVALID_IMPORT_ROW");
            if (practiceGroup != null && "THEORY".equals(sessionType) && practiceGroup != 0) {
                error(messages, "INVALID_IMPORT_ROW", "Lich ly thuyet phai co practice_group_no = 0.");
            }
            if (practiceGroup != null && "PRACTICE".equals(sessionType) && practiceGroup == 0) {
                error(messages, "INVALID_IMPORT_ROW", "Lich thuc hanh phai co practice_group_no > 0.");
            }

            String suppliedRoomType = normalize(value(values, "required_room_type"));
            if (!suppliedRoomType.isBlank() && !ROOM_TYPES.contains(suppliedRoomType)) {
                error(messages, "INVALID_IMPORT_ROW", "required_room_type khong hop le.");
            }
            String requiredRoomType = suppliedRoomType.isBlank() && course != null ? normalize(course.requiredRoomType()) : suppliedRoomType;
            String buildingCode = value(values, "preferred_building_code");
            BuildingRef building = buildingCode.isBlank() ? null : refs.buildings().get(normalize(buildingCode));
            if (!buildingCode.isBlank() && (building == null || building.deleted())) {
                warning(messages, "PREFERRED_BUILDING_UNAVAILABLE", "Toa nha uu tien khong kha dung; Staff se xu ly phan phong.");
            }
            String classroomCode = value(values, "preferred_classroom_code");
            ClassroomRef classroom = classroomCode.isBlank() ? null : refs.classrooms().get(normalize(classroomCode));
            if (!classroomCode.isBlank() && classroom == null) {
                warning(messages, "PREFERRED_CLASSROOM_NOT_FOUND", "Phong hoc uu tien khong ton tai; lich se cho Staff phan phong.");
            } else if (classroom != null) {
                if (!classroom.active() || classroom.deleted() || classroom.buildingDeleted()) {
                    warning(messages, "ROOM_INACTIVE_OR_DELETED", "Phong hoc uu tien khong hoat dong hoac da bi xoa; Staff se xu ly.");
                }
                if (building != null && classroom.buildingId() != building.id()) {
                    warning(messages, "PREFERRED_ROOM_BUILDING_MISMATCH", "Phong hoc khong thuoc toa nha uu tien; Staff se xu ly.");
                }
                if (maximum != null && classroom.capacity() < maximum) {
                    warning(messages, "CAPACITY_EXCEEDED", "Phong hoc uu tien khong du suc chua; Staff se xu ly.");
                }
                if (!requiredRoomType.isBlank() && !requiredRoomType.equals(normalize(classroom.roomType()))) {
                    warning(messages, "ROOM_TYPE_MISMATCH", "Phong hoc uu tien khong dung loai phong yeu cau; Staff se xu ly.");
                }
            }

            String rowSignature = values.entrySet().stream().sorted(Map.Entry.comparingByKey())
                    .map(entry -> entry.getKey() + "=" + normalize(entry.getValue())).collect(Collectors.joining("|"));
            if (!rowSignatures.add(rowSignature)) error(messages, "DUPLICATE_ROW", "Dong import bi trung hoan toan trong file.");
            String sectionSignature = String.join("|", normalize(rowSemesterCode), normalize(courseCode), normalize(sectionCode));
            if (!sectionSignatures.add(sectionSignature)) {
                error(messages, "DUPLICATE_ROW", "Lop hoc phan bi lap trong file.");
            }
            String scheduleSignature = String.join("|", normalize(rowSemesterCode), normalize(courseCode), normalize(sectionCode),
                    day, string(slotStart), string(slotEnd), string(practiceGroup));
            if (!scheduleSignatures.add(scheduleSignature)) error(messages, "DUPLICATE_ROW", "Khoa lich hoc bi trung trong file.");

            SectionRef section = course == null ? null : sections.get(course.id() + "|" + normalize(sectionCode));
            ScheduleRef matchedSchedule = findSchedule(schedulesBySection.getOrDefault(section == null ? -1L : section.id(), List.of()),
                    day, slotStart, slotEnd, practiceGroup);
            if (lecturer != null && isScheduleRangeValid(day, slotStart, slotEnd, fromWeek, toWeek)) {
                ImportCandidate candidate = new ImportCandidate(
                        rowNumber, lecturer.id(), matchedSchedule == null ? null : matchedSchedule.id(),
                        day, slotStart, slotEnd, fromWeek, toWeek
                );
                addLecturerConflicts(messages, candidate, fileCandidates, refs.schedules(), sectionsById, importMode);
                addCalendarBlockConflicts(messages, candidate, refs);
                fileCandidates.add(candidate);
            }

            String operation = determineOperation(section, matchedSchedule, lecturer, enrolled, maximum, className,
                    day, slotStart, slotEnd, fromWeek, toWeek, sessionType, practiceGroup, classroom);
            String status = messages.stream().anyMatch(message -> "ERROR".equals(message.severity())) ? "ERROR"
                    : messages.isEmpty() ? "VALID" : "WARNING";
            if ("ERROR".equals(status)) operation = "ERROR";
            String scheduleLabel = day + " " + string(slotStart) + "-" + string(slotEnd) + ", tuan "
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
        ImportPreviewResponse preview = new ImportPreviewResponse(
                "PREVIEW-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT),
                semester.id(), semester.code(), resultRows.size(), valid, warnings, errorCount,
                operations, errors, List.copyOf(resultRows));
        return new TimetableImportValidationResult(preview, semester, refs);
    }

    private void addLecturerConflicts(
            List<ImportPreviewMessage> messages,
            ImportCandidate candidate,
            List<ImportCandidate> fileCandidates,
            List<ScheduleRef> existingSchedules,
            Map<Long, SectionRef> sectionsById,
            TimetableImportMode importMode
    ) {
        boolean conflictsInFile = fileCandidates.stream().anyMatch(existing ->
                existing.lecturerId() == candidate.lecturerId()
                        && candidate.dayOfWeek().equals(existing.dayOfWeek())
                        && overlaps(candidate.slotStart(), candidate.slotEnd(), existing.slotStart(), existing.slotEnd())
                        && weekOverlaps(candidate.fromWeek(), candidate.toWeek(), existing.fromWeek(), existing.toWeek()));
        if (conflictsInFile) {
            error(messages, "LECTURER_TIME_CONFLICT", "Giang vien bi xep day trung thoi gian trong file import.");
            return;
        }
        if (importMode == TimetableImportMode.SYNC_FILE_SCOPE) return;

        boolean conflictsExisting = existingSchedules.stream().anyMatch(existing -> {
            if (candidate.existingScheduleId() != null && candidate.existingScheduleId() == existing.id()) return false;
            if (INACTIVE_SCHEDULE_STATUSES.contains(normalize(existing.status()))) return false;
            SectionRef section = sectionsById.get(existing.sectionId());
            return section != null
                    && section.lecturerId() == candidate.lecturerId()
                    && candidate.dayOfWeek().equals(normalize(existing.dayOfWeek()))
                    && overlaps(candidate.slotStart(), candidate.slotEnd(), existing.slotStart(), existing.slotEnd())
                    && weekOverlaps(candidate.fromWeek(), candidate.toWeek(), existing.fromWeek(), existing.toWeek());
        });
        if (conflictsExisting) {
            error(messages, "LECTURER_TIME_CONFLICT", "Giang vien da co lich day trung thoi gian trong hoc ky.");
        }
    }

    private void addCalendarBlockConflicts(
            List<ImportPreviewMessage> messages,
            ImportCandidate candidate,
            ReferenceData refs
    ) {
        if (refs.calendarBlocks().isEmpty() || refs.semesterWeeks().isEmpty() || refs.weekRange() == null) return;
        int from = candidate.fromWeek() == null ? refs.weekRange().minimum() : candidate.fromWeek();
        int to = candidate.toWeek() == null ? refs.weekRange().maximum() : candidate.toWeek();
        DayOfWeek targetDay = dayOfWeek(candidate.dayOfWeek());
        if (targetDay == null) return;

        for (int weekNo = from; weekNo <= to; weekNo++) {
            SemesterWeekRef week = refs.semesterWeeks().get(weekNo);
            if (week == null) continue;
            LocalDate teachingDate = week.startDate().with(TemporalAdjusters.nextOrSame(targetDay));
            if (teachingDate.isAfter(week.endDate())) continue;
            boolean blocked = refs.calendarBlocks().stream().anyMatch(block ->
                    !block.teachingAllowed()
                            && !teachingDate.isBefore(block.startDate())
                            && !teachingDate.isAfter(block.endDate()));

        }
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
                                      String sessionType, Integer practiceGroup, ClassroomRef classroom) {
        if (section == null) return "CREATE_SECTION";
        boolean sectionChanged = lecturer != null && (section.lecturerId() != lecturer.id()
                || enrolled != null && section.enrolledCount() != enrolled
                || maximum != null && section.maxCapacity() != maximum
                || !normalize(section.className()).equals(normalize(className)));
        ScheduleRef candidate = exactSchedule;
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
        boolean validWeeks = from == null && to == null || from != null && to != null && from <= to;
        return DAYS.contains(day) && start != null && end != null && start <= end && validWeeks;
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
                            Integer minimum, Integer maximum, String errorCode) {
        String raw = value(values, field);
        if (raw.isBlank()) {
            error(messages, errorCode, field + " khong duoc de trong.");
            return null;
        }
        try {
            int value = raw.endsWith(".0") ? Integer.parseInt(raw.substring(0, raw.length() - 2)) : Integer.parseInt(raw);
            if (minimum != null && value < minimum || maximum != null && value > maximum) {
                error(messages, errorCode, field + " nam ngoai gioi han cho phep.");
                return null;
            }
            return value;
        } catch (NumberFormatException exception) {
            error(messages, errorCode, field + " phai la so nguyen.");
            return null;
        }
    }

    private Integer optionalInteger(Map<String, String> values, String field, List<ImportPreviewMessage> messages,
                                    Integer minimum, Integer maximum, Integer defaultValue, String errorCode) {
        if (value(values, field).isBlank()) return defaultValue;
        return integer(values, field, messages, minimum, maximum, errorCode);
    }

    private void require(List<ImportPreviewMessage> messages, String value, String field) {
        if (value.isBlank()) error(messages, "INVALID_IMPORT_ROW", field + " khong duoc de trong.");
    }

    private void maxLength(List<ImportPreviewMessage> messages, String value, String field, int maximum) {
        if (value != null && value.length() > maximum) {
            error(messages, "INVALID_IMPORT_ROW", field + " vuot qua " + maximum + " ky tu.");
        }
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

    private DayOfWeek dayOfWeek(String value) {
        return switch (normalize(value)) {
            case "MON" -> DayOfWeek.MONDAY;
            case "TUE" -> DayOfWeek.TUESDAY;
            case "WED" -> DayOfWeek.WEDNESDAY;
            case "THU" -> DayOfWeek.THURSDAY;
            case "FRI" -> DayOfWeek.FRIDAY;
            case "SAT" -> DayOfWeek.SATURDAY;
            case "SUN" -> DayOfWeek.SUNDAY;
            default -> null;
        };
    }

    private <T> Map<String, Integer> countBy(List<T> values, Function<T, String> classifier) {
        return values.stream().map(classifier).sorted(Comparator.naturalOrder())
                .collect(Collectors.toMap(Function.identity(), item -> 1, Integer::sum, LinkedHashMap::new));
    }

    private record ImportCandidate(
            int rowNumber,
            long lecturerId,
            Long existingScheduleId,
            String dayOfWeek,
            int slotStart,
            int slotEnd,
            Integer fromWeek,
            Integer toWeek
    ) {}
}
