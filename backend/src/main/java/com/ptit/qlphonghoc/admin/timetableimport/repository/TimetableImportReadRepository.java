package com.ptit.qlphonghoc.admin.timetableimport.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Repository
public class TimetableImportReadRepository implements TimetableImportDataSource {

    private final NamedParameterJdbcTemplate jdbc;

    public TimetableImportReadRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<SemesterRef> findSemester(Long semesterId, String semesterCode) {
        String sql = """
                SELECT semester_id, semester_code, timetable_status
                FROM semesters
                WHERE is_deleted = FALSE
                  AND (:semesterId IS NULL OR semester_id = :semesterId)
                  AND (:semesterCode IS NULL OR UPPER(semester_code) = :semesterCode)
                LIMIT 1
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("semesterId", semesterId)
                .addValue("semesterCode", normalizeNullable(semesterCode));
        return jdbc.query(sql, params, (rs, rowNum) -> new SemesterRef(
                rs.getLong("semester_id"), rs.getString("semester_code"), rs.getString("timetable_status")
        )).stream().findFirst();
    }

    @Override
    public ReferenceData loadReferenceData(long semesterId) {
        MapSqlParameterSource params = new MapSqlParameterSource("semesterId", semesterId);

        Map<String, CourseRef> courses = index(jdbc.query("""
                SELECT course_id, course_code, required_room_type
                FROM courses WHERE is_deleted = FALSE
                """, params, (rs, n) -> new CourseRef(
                rs.getLong("course_id"), rs.getString("course_code"), rs.getString("required_room_type")
        )), CourseRef::code);

        Map<String, LecturerRef> lecturers = index(jdbc.query("""
                SELECT lecturer_id, lecturer_code FROM lecturers WHERE is_deleted = FALSE
                """, params, (rs, n) -> new LecturerRef(rs.getLong("lecturer_id"), rs.getString("lecturer_code"))), LecturerRef::code);

        Map<Integer, SlotRef> slots = new LinkedHashMap<>();
        jdbc.query("SELECT slot_id, slot_no, start_time, end_time FROM time_slots", params, rs -> {
            slots.put(rs.getInt("slot_no"), new SlotRef(
                    rs.getLong("slot_id"), rs.getInt("slot_no"), rs.getTime("start_time").toLocalTime(),
                    rs.getTime("end_time").toLocalTime()
            ));
        });

        Map<String, BuildingRef> buildings = index(jdbc.query("""
                SELECT building_id, building_code, is_deleted FROM buildings
                """, params, (rs, n) -> new BuildingRef(
                rs.getLong("building_id"), rs.getString("building_code"), rs.getBoolean("is_deleted")
        )), BuildingRef::code);

        Map<String, ClassroomRef> classrooms = index(jdbc.query("""
                SELECT cr.classroom_id, cr.classroom_code, cr.building_id, b.building_code,
                       cr.room_type, cr.capacity, cr.is_active, cr.is_deleted, b.is_deleted AS building_deleted
                FROM classrooms cr JOIN buildings b ON b.building_id = cr.building_id
                """, params, (rs, n) -> new ClassroomRef(
                rs.getLong("classroom_id"), rs.getString("classroom_code"), rs.getLong("building_id"),
                rs.getString("building_code"), rs.getString("room_type"), rs.getInt("capacity"),
                rs.getBoolean("is_active"), rs.getBoolean("is_deleted"), rs.getBoolean("building_deleted")
        )), ClassroomRef::code);

        WeekRange weekRange = jdbc.query("""
                SELECT MIN(week_no) AS min_week, MAX(week_no) AS max_week
                FROM semester_weeks WHERE semester_id = :semesterId
                """, params, rs -> rs.next() && rs.getObject("min_week") != null
                ? new WeekRange(rs.getInt("min_week"), rs.getInt("max_week")) : null);

        Map<Integer, SemesterWeekRef> semesterWeeks = new LinkedHashMap<>();
        jdbc.query("""
                SELECT semester_week_id, week_no, start_date, end_date
                FROM semester_weeks
                WHERE semester_id = :semesterId
                ORDER BY week_no
                """, params, rs -> {
            semesterWeeks.put(rs.getInt("week_no"), new SemesterWeekRef(
                    rs.getLong("semester_week_id"),
                    rs.getInt("week_no"),
                    rs.getDate("start_date").toLocalDate(),
                    rs.getDate("end_date").toLocalDate()
            ));
        });

        Map<String, ClassRef> classes = index(jdbc.query("""
                SELECT class_name, COUNT(*) AS student_count
                FROM students
                WHERE is_deleted = FALSE
                GROUP BY class_name
                """, params, (rs, n) -> new ClassRef(
                rs.getString("class_name"), rs.getInt("student_count")
        )), ClassRef::name);

        List<CalendarBlockRef> calendarBlocks = jdbc.query("""
                SELECT calendar_block_id, title, block_type, start_date, end_date, is_teaching_allowed
                FROM academic_calendar_blocks
                WHERE semester_id = :semesterId
                  AND is_teaching_allowed = FALSE
                """, params, (rs, n) -> new CalendarBlockRef(
                rs.getLong("calendar_block_id"),
                rs.getString("title"),
                rs.getString("block_type"),
                rs.getDate("start_date").toLocalDate(),
                rs.getDate("end_date").toLocalDate(),
                rs.getBoolean("is_teaching_allowed")
        ));

        List<SectionRef> sections = jdbc.query("""
                SELECT cs.section_id, cs.course_id, cs.lecturer_id, cs.section_code, cs.class_name,
                       cs.enrolled_count, cs.max_capacity, cs.status
                FROM class_sections cs WHERE cs.semester_id = :semesterId
                """, params, (rs, n) -> new SectionRef(
                rs.getLong("section_id"), rs.getLong("course_id"), rs.getLong("lecturer_id"),
                rs.getString("section_code"), rs.getString("class_name"), rs.getInt("enrolled_count"),
                rs.getInt("max_capacity"), rs.getString("status")
        ));

        List<ScheduleRef> schedules = jdbc.query("""
                SELECT sc.schedule_id, sc.section_id, sc.classroom_id, sc.day_of_week,
                       ss.slot_no AS slot_start_no, se.slot_no AS slot_end_no,
                       sc.from_week_no, sc.to_week_no, sc.session_type, sc.practice_group_no, sc.status
                FROM schedules sc
                JOIN class_sections cs ON cs.section_id = sc.section_id
                JOIN time_slots ss ON ss.slot_id = sc.slot_start_id
                JOIN time_slots se ON se.slot_id = sc.slot_end_id
                WHERE cs.semester_id = :semesterId
                """, params, (rs, n) -> new ScheduleRef(
                rs.getLong("schedule_id"), rs.getLong("section_id"), nullableLong(rs.getObject("classroom_id")),
                rs.getString("day_of_week"), rs.getInt("slot_start_no"), rs.getInt("slot_end_no"),
                nullableInt(rs.getObject("from_week_no")), nullableInt(rs.getObject("to_week_no")),
                rs.getString("session_type"), rs.getInt("practice_group_no"), rs.getString("status")
        ));

        return new ReferenceData(courses, lecturers, slots, buildings, classrooms, weekRange,
                semesterWeeks, classes, calendarBlocks, sections, schedules);
    }

    private <T> Map<String, T> index(List<T> values, java.util.function.Function<T, String> key) {
        Map<String, T> result = new LinkedHashMap<>();
        values.forEach(value -> result.put(normalize(key.apply(value)), value));
        return result;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNullable(String value) {
        return value == null || value.isBlank() ? null : normalize(value);
    }

    private static Integer nullableInt(Object value) {
        return value == null ? null : ((Number) value).intValue();
    }

    private static Long nullableLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    public record SemesterRef(long id, String code, String timetableStatus) {}
    public record CourseRef(long id, String code, String requiredRoomType) {}
    public record LecturerRef(long id, String code) {}
    public record SlotRef(long id, int number, java.time.LocalTime startTime, java.time.LocalTime endTime) {}
    public record BuildingRef(long id, String code, boolean deleted) {}
    public record ClassroomRef(long id, String code, long buildingId, String buildingCode, String roomType,
                               int capacity, boolean active, boolean deleted, boolean buildingDeleted) {}
    public record WeekRange(int minimum, int maximum) {}
    public record SemesterWeekRef(long id, int weekNo, LocalDate startDate, LocalDate endDate) {}
    public record ClassRef(String name, int studentCount) {}
    public record CalendarBlockRef(long id, String title, String blockType, LocalDate startDate, LocalDate endDate,
                                   boolean teachingAllowed) {}
    public record SectionRef(long id, long courseId, long lecturerId, String sectionCode, String className,
                             int enrolledCount, int maxCapacity, String status) {}
    public record ScheduleRef(long id, long sectionId, Long classroomId, String dayOfWeek, int slotStart,
                              int slotEnd, Integer fromWeek, Integer toWeek, String sessionType,
                              int practiceGroup, String status) {}
    public record ReferenceData(
            Map<String, CourseRef> courses,
            Map<String, LecturerRef> lecturers,
            Map<Integer, SlotRef> slots,
            Map<String, BuildingRef> buildings,
            Map<String, ClassroomRef> classrooms,
            WeekRange weekRange,
            Map<Integer, SemesterWeekRef> semesterWeeks,
            Map<String, ClassRef> classes,
            List<CalendarBlockRef> calendarBlocks,
            List<SectionRef> sections,
            List<ScheduleRef> schedules
    ) {}
}
