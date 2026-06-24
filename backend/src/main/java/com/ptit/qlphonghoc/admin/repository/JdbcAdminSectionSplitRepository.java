package com.ptit.qlphonghoc.admin.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JdbcAdminSectionSplitRepository implements AdminSectionSplitRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public JdbcAdminSectionSplitRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<SplitContext> findContextForUpdate(Integer sectionId, Integer scheduleId) {
        List<SplitContext> rows = jdbc.query(
                """
                SELECT cs.semester_id,
                       sem.timetable_status,
                       cs.course_id,
                       c.course_code,
                       cs.section_code,
                       cs.class_name,
                       cs.enrolled_count,
                       sch.from_week_no,
                       sch.to_week_no,
                       sch.session_type,
                       sch.practice_group_no
                FROM class_sections cs
                JOIN semesters sem ON sem.semester_id = cs.semester_id
                JOIN courses c ON c.course_id = cs.course_id
                JOIN schedules sch ON sch.section_id = cs.section_id
                WHERE cs.section_id = :sectionId
                  AND sch.schedule_id = :scheduleId
                  AND cs.status = 'ACTIVE'
                  AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
                FOR UPDATE
                """,
                new MapSqlParameterSource()
                        .addValue("sectionId", sectionId)
                        .addValue("scheduleId", scheduleId),
                (rs, rowNum) -> new SplitContext(
                        rs.getInt("semester_id"),
                        rs.getString("timetable_status"),
                        rs.getInt("course_id"),
                        rs.getString("course_code"),
                        rs.getString("section_code"),
                        rs.getString("class_name"),
                        rs.getInt("enrolled_count"),
                        rs.getObject("from_week_no", Integer.class),
                        rs.getObject("to_week_no", Integer.class),
                        rs.getString("session_type"),
                        rs.getInt("practice_group_no")
                )
        );
        return rows.stream().findFirst();
    }

    @Override
    public boolean lecturerExists(Integer lecturerId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM lecturers WHERE lecturer_id = :lecturerId AND is_deleted = FALSE",
                new MapSqlParameterSource("lecturerId", lecturerId),
                Integer.class
        );
        return count != null && count > 0;
    }

    @Override
    public Optional<SlotRef> resolveSlot(Integer slotId, Integer slotNo) {
        if (slotId == null && slotNo == null) return Optional.empty();
        return jdbc.query(
                """
                SELECT slot_id, slot_no
                FROM time_slots
                WHERE (:slotId IS NOT NULL AND slot_id = :slotId)
                   OR (:slotId IS NULL AND slot_no = :slotNo)
                LIMIT 1
                """,
                new MapSqlParameterSource()
                        .addValue("slotId", slotId)
                        .addValue("slotNo", slotNo),
                (rs, rowNum) -> new SlotRef(rs.getInt("slot_id"), rs.getInt("slot_no"))
        ).stream().findFirst();
    }

    @Override
    public boolean sectionCodeExists(
            Integer semesterId,
            Integer courseId,
            String sectionCode,
            Integer excludedSectionId
    ) {
        Integer count = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM class_sections
                WHERE semester_id = :semesterId
                  AND course_id = :courseId
                  AND UPPER(section_code) = UPPER(:sectionCode)
                  AND section_id <> :excludedSectionId
                """,
                new MapSqlParameterSource()
                        .addValue("semesterId", semesterId)
                        .addValue("courseId", courseId)
                        .addValue("sectionCode", sectionCode)
                        .addValue("excludedSectionId", excludedSectionId),
                Integer.class
        );
        return count != null && count > 0;
    }

    @Override
    public boolean lecturerHasOverlap(
            Integer semesterId,
            Integer lecturerId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo,
            Integer excludedScheduleId
    ) {
        Integer count = jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM schedules sch
                JOIN class_sections cs ON cs.section_id = sch.section_id
                WHERE cs.semester_id = :semesterId
                  AND cs.lecturer_id = :lecturerId
                  AND cs.status = 'ACTIVE'
                  AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
                  AND sch.schedule_id <> :excludedScheduleId
                  AND sch.day_of_week = :dayOfWeek
                  AND sch.slot_start_id <= :slotEndId
                  AND sch.slot_end_id >= :slotStartId
                  AND COALESCE(sch.from_week_no, 1) <= COALESCE(:toWeekNo, 999)
                  AND COALESCE(:fromWeekNo, 1) <= COALESCE(sch.to_week_no, 999)
                """,
                new MapSqlParameterSource()
                        .addValue("semesterId", semesterId)
                        .addValue("lecturerId", lecturerId)
                        .addValue("dayOfWeek", dayOfWeek)
                        .addValue("slotStartId", slotStartId)
                        .addValue("slotEndId", slotEndId)
                        .addValue("fromWeekNo", fromWeekNo)
                        .addValue("toWeekNo", toWeekNo)
                        .addValue("excludedScheduleId", excludedScheduleId),
                Integer.class
        );
        return count != null && count > 0;
    }

    @Override
    public int updateOriginalSection(
            Integer sectionId,
            String sectionCode,
            Integer studentCount,
            Integer lecturerId
    ) {
        return jdbc.update(
                """
                UPDATE class_sections
                SET section_code = :sectionCode,
                    enrolled_count = :studentCount,
                    max_capacity = :studentCount,
                    lecturer_id = :lecturerId
                WHERE section_id = :sectionId
                  AND status = 'ACTIVE'
                """,
                new MapSqlParameterSource()
                        .addValue("sectionId", sectionId)
                        .addValue("sectionCode", sectionCode)
                        .addValue("studentCount", studentCount)
                        .addValue("lecturerId", lecturerId)
        );
    }

    @Override
    public int updateOriginalSchedule(
            Integer sectionId,
            Integer scheduleId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            String note
    ) {
        return jdbc.update(
                """
                UPDATE schedules
                SET classroom_id = NULL,
                    day_of_week = :dayOfWeek,
                    slot_start_id = :slotStartId,
                    slot_end_id = :slotEndId,
                    start_time = (SELECT start_time FROM time_slots WHERE slot_id = :slotStartId),
                    end_time = (SELECT end_time FROM time_slots WHERE slot_id = :slotEndId),
                    assigned_by = NULL,
                    assigned_at = NULL,
                    status = 'UNASSIGNED',
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL,
                    note = :note
                WHERE schedule_id = :scheduleId
                  AND section_id = :sectionId
                  AND status NOT IN ('CANCELLED', 'INACTIVE')
                """,
                new MapSqlParameterSource()
                        .addValue("sectionId", sectionId)
                        .addValue("scheduleId", scheduleId)
                        .addValue("dayOfWeek", dayOfWeek)
                        .addValue("slotStartId", slotStartId)
                        .addValue("slotEndId", slotEndId)
                        .addValue("note", note)
        );
    }

    @Override
    public Integer insertSection(
            SplitContext context,
            String sectionCode,
            Integer studentCount,
            Integer lecturerId
    ) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(
                """
                INSERT INTO class_sections (
                    semester_id, course_id, lecturer_id, section_code, class_name,
                    enrolled_count, max_capacity, import_source, status
                ) VALUES (
                    :semesterId, :courseId, :lecturerId, :sectionCode, :className,
                    :studentCount, :studentCount, 'ADMIN_SPLIT', 'ACTIVE'
                )
                """,
                new MapSqlParameterSource()
                        .addValue("semesterId", context.semesterId())
                        .addValue("courseId", context.courseId())
                        .addValue("lecturerId", lecturerId)
                        .addValue("sectionCode", sectionCode)
                        .addValue("className", context.className())
                        .addValue("studentCount", studentCount),
                keys,
                new String[]{"section_id"}
        );
        if (keys.getKey() == null) throw new IllegalStateException("Database did not return section_id");
        return keys.getKey().intValue();
    }

    @Override
    public Integer insertSchedule(
            Integer sectionId,
            SplitContext context,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            String note
    ) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(
                """
                INSERT INTO schedules (
                    section_id, classroom_id, day_of_week, slot_start_id, slot_end_id,
                    start_time, end_time, from_week_no, to_week_no, session_type,
                    practice_group_no, assigned_by, assigned_at, validation_status,
                    conflict_reason, status, note
                ) SELECT
                    :sectionId, NULL, :dayOfWeek, start_slot.slot_id, end_slot.slot_id,
                    start_slot.start_time, end_slot.end_time, :fromWeekNo, :toWeekNo, :sessionType,
                    :practiceGroupNo, NULL, NULL, 'NOT_CHECKED', NULL, 'UNASSIGNED', :note
                FROM time_slots start_slot
                JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
                WHERE start_slot.slot_id = :slotStartId
                """,
                new MapSqlParameterSource()
                        .addValue("sectionId", sectionId)
                        .addValue("dayOfWeek", dayOfWeek)
                        .addValue("slotStartId", slotStartId)
                        .addValue("slotEndId", slotEndId)
                        .addValue("fromWeekNo", context.fromWeekNo())
                        .addValue("toWeekNo", context.toWeekNo())
                        .addValue("sessionType", context.sessionType())
                        .addValue("practiceGroupNo", context.practiceGroupNo())
                        .addValue("note", note),
                keys,
                new String[]{"schedule_id"}
        );
        if (keys.getKey() == null) throw new IllegalStateException("Database did not return schedule_id");
        return keys.getKey().intValue();
    }

    @Override
    public int markSemesterDraft(Integer semesterId) {
        return jdbc.update(
                "UPDATE semesters SET timetable_status = 'DRAFT' WHERE semester_id = :semesterId",
                new MapSqlParameterSource("semesterId", semesterId)
        );
    }
}
