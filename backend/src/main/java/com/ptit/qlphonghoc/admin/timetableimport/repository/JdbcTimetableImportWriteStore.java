package com.ptit.qlphonghoc.admin.timetableimport.repository;

import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.SemesterRef;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Time;
import java.sql.Types;
import java.util.Optional;

@Repository
public class JdbcTimetableImportWriteStore implements TimetableImportWriteStore {

    private final NamedParameterJdbcTemplate jdbc;

    public JdbcTimetableImportWriteStore(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<SemesterRef> lockSemester(long semesterId) {
        return jdbc.query("""
                SELECT semester_id, semester_code, timetable_status
                FROM semesters
                WHERE semester_id = :semesterId AND is_deleted = FALSE
                FOR UPDATE
                """, new MapSqlParameterSource("semesterId", semesterId), (rs, rowNum) -> new SemesterRef(
                rs.getLong("semester_id"), rs.getString("semester_code"), rs.getString("timetable_status")
        )).stream().findFirst();
    }

    @Override
    public long insertSection(SectionWrite row) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update("""
                INSERT INTO class_sections (
                    semester_id, course_id, lecturer_id, section_code, class_name,
                    enrolled_count, max_capacity, import_source, import_batch_code,
                    last_imported_at, status
                ) VALUES (
                    :semesterId, :courseId, :lecturerId, :sectionCode, :className,
                    :enrolledCount, :maxCapacity, :importSource, :importBatchCode,
                    CURRENT_TIMESTAMP, 'ACTIVE'
                )
                """, sectionParams(row), keys, new String[]{"section_id"});
        if (keys.getKey() == null) throw new IllegalStateException("Database did not return section_id");
        return keys.getKey().longValue();
    }

    @Override
    public void updateSection(long sectionId, SectionWrite row) {
        MapSqlParameterSource params = sectionParams(row).addValue("sectionId", sectionId);
        int changed = jdbc.update("""
                UPDATE class_sections
                SET lecturer_id = :lecturerId,
                    class_name = :className,
                    enrolled_count = :enrolledCount,
                    max_capacity = :maxCapacity,
                    import_source = :importSource,
                    import_batch_code = :importBatchCode,
                    last_imported_at = CURRENT_TIMESTAMP,
                    status = 'ACTIVE'
                WHERE section_id = :sectionId
                """, params);
        if (changed != 1) throw new IllegalStateException("Class section no longer exists");
    }

    @Override
    public long insertSchedule(ScheduleWrite row) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update("""
                INSERT INTO schedules (
                    section_id, classroom_id, day_of_week, slot_start_id, slot_end_id,
                    start_time, end_time, from_week_no, to_week_no, session_type,
                    practice_group_no, validation_status, conflict_reason, status
                ) VALUES (
                    :sectionId, :classroomId, :dayOfWeek, :slotStartId, :slotEndId,
                    :startTime, :endTime, :fromWeekNo, :toWeekNo, :sessionType,
                    :practiceGroupNo, 'NOT_CHECKED', NULL, :status
                )
                """, scheduleParams(row), keys, new String[]{"schedule_id"});
        if (keys.getKey() == null) throw new IllegalStateException("Database did not return schedule_id");
        return keys.getKey().longValue();
    }

    @Override
    public void updateSchedule(long scheduleId, ScheduleWrite row) {
        MapSqlParameterSource params = scheduleParams(row).addValue("scheduleId", scheduleId);
        int changed = jdbc.update("""
                UPDATE schedules
                SET classroom_id = :classroomId,
                    assigned_by = CASE WHEN :classroomId IS NULL THEN NULL ELSE assigned_by END,
                    assigned_at = CASE WHEN :classroomId IS NULL THEN NULL ELSE assigned_at END,
                    start_time = :startTime,
                    end_time = :endTime,
                    from_week_no = :fromWeekNo,
                    to_week_no = :toWeekNo,
                    session_type = :sessionType,
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL,
                    status = :status
                WHERE schedule_id = :scheduleId
                """, params);
        if (changed != 1) throw new IllegalStateException("Schedule no longer exists");
    }

    @Override
    public int softCancelSchedule(long scheduleId, String note) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("scheduleId", scheduleId)
                .addValue("note", note);
        return jdbc.update("""
                UPDATE schedules
                SET status = 'CANCELLED',
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL,
                    note = :note
                WHERE schedule_id = :scheduleId
                  AND status NOT IN ('CANCELLED', 'INACTIVE')
                """, params);
    }

    @Override
    public void markSemesterDraft(long semesterId) {
        int changed = jdbc.update("""
                UPDATE semesters SET timetable_status = 'DRAFT' WHERE semester_id = :semesterId
                """, new MapSqlParameterSource("semesterId", semesterId));
        if (changed != 1) throw new IllegalStateException("Semester no longer exists");
    }

    private MapSqlParameterSource sectionParams(SectionWrite row) {
        return new MapSqlParameterSource()
                .addValue("semesterId", row.semesterId())
                .addValue("courseId", row.courseId())
                .addValue("lecturerId", row.lecturerId())
                .addValue("sectionCode", row.sectionCode())
                .addValue("className", row.className())
                .addValue("enrolledCount", row.enrolledCount())
                .addValue("maxCapacity", row.maxCapacity())
                .addValue("importSource", row.importSource())
                .addValue("importBatchCode", row.importBatchCode());
    }

    private MapSqlParameterSource scheduleParams(ScheduleWrite row) {
        return new MapSqlParameterSource()
                .addValue("sectionId", row.sectionId())
                .addValue("classroomId", row.classroomId(), Types.BIGINT)
                .addValue("dayOfWeek", row.dayOfWeek())
                .addValue("slotStartId", row.slotStartId())
                .addValue("slotEndId", row.slotEndId())
                .addValue("startTime", Time.valueOf(row.startTime()))
                .addValue("endTime", Time.valueOf(row.endTime()))
                .addValue("fromWeekNo", row.fromWeekNo(), Types.SMALLINT)
                .addValue("toWeekNo", row.toWeekNo(), Types.SMALLINT)
                .addValue("sessionType", row.sessionType())
                .addValue("practiceGroupNo", row.practiceGroupNo())
                .addValue("status", row.status());
    }
}
