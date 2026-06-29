package com.ptit.qlphonghoc.admin.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class JdbcAdminSectionSplitRepository implements AdminSectionSplitRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public JdbcAdminSectionSplitRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<SplitContext> findContextForUpdate(Integer sectionId, Integer scheduleId) {
        return findContext(sectionId, scheduleId, true);
    }

    @Override
    public Optional<SplitContext> findContext(Integer sectionId, Integer scheduleId) {
        return findContext(sectionId, scheduleId, false);
    }

    private Optional<SplitContext> findContext(Integer sectionId, Integer scheduleId, boolean forUpdate) {
        List<SplitContext> rows = jdbc.query(
                ("""
                SELECT cs.semester_id,
                       sem.timetable_status,
                       cs.course_id,
                       c.course_code,
                       c.required_room_type,
                       cs.section_code,
                       cs.class_name,
                       cs.enrolled_count,
                       sch.day_of_week,
                       sch.slot_start_id,
                       sch.slot_end_id,
                       ts_start.slot_no AS slot_start_no,
                       ts_end.slot_no AS slot_end_no,
                       sch.from_week_no,
                       sch.to_week_no,
                       sch.session_type,
                       sch.practice_group_no
                FROM class_sections cs
                JOIN semesters sem ON sem.semester_id = cs.semester_id
                JOIN courses c ON c.course_id = cs.course_id
                JOIN schedules sch ON sch.section_id = cs.section_id
                JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
                JOIN time_slots ts_end ON ts_end.slot_id = sch.slot_end_id
                WHERE cs.section_id = :sectionId
                  AND sch.schedule_id = :scheduleId
                  AND cs.status = 'ACTIVE'
                  AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
                """ + (forUpdate ? " FOR UPDATE" : "")),
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
                        rs.getString("day_of_week"),
                        rs.getObject("slot_start_id", Integer.class),
                        rs.getObject("slot_end_id", Integer.class),
                        rs.getObject("slot_start_no", Integer.class),
                        rs.getObject("slot_end_no", Integer.class),
                        rs.getObject("from_week_no", Integer.class),
                        rs.getObject("to_week_no", Integer.class),
                        rs.getString("session_type"),
                        rs.getInt("practice_group_no"),
                        rs.getString("required_room_type")
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
                  AND status <> 'CANCELLED'
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
    public boolean roomHasOverlap(
            Integer semesterId,
            Integer classroomId,
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
                  AND cs.status = 'ACTIVE'
                  AND sch.status = 'ASSIGNED'
                  AND sch.classroom_id = :classroomId
                  AND sch.schedule_id <> :excludedScheduleId
                  AND sch.day_of_week = :dayOfWeek
                  AND sch.slot_start_id <= :slotEndId
                  AND sch.slot_end_id >= :slotStartId
                  AND COALESCE(sch.from_week_no, 1) <= COALESCE(:toWeekNo, 999)
                  AND COALESCE(:fromWeekNo, 1) <= COALESCE(sch.to_week_no, 999)
                """,
                new MapSqlParameterSource()
                        .addValue("semesterId", semesterId)
                        .addValue("classroomId", classroomId)
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
    public Optional<RoomRef> findRoom(Integer classroomId) {
        return jdbc.query(
                """
                SELECT cr.classroom_id,
                       CONCAT(b.building_code, '-', cr.room_number) AS room_code,
                       cr.capacity,
                       cr.room_type,
                       cr.is_active,
                       cr.is_deleted
                FROM classrooms cr
                JOIN buildings b ON b.building_id = cr.building_id
                WHERE cr.classroom_id = :classroomId
                """,
                new MapSqlParameterSource("classroomId", classroomId),
                (rs, rowNum) -> new RoomRef(
                        rs.getInt("classroom_id"),
                        rs.getString("room_code"),
                        rs.getObject("capacity", Integer.class),
                        rs.getString("room_type"),
                        rs.getBoolean("is_active"),
                        rs.getBoolean("is_deleted")
                )
        ).stream().findFirst();
    }

    @Override
    public List<RoomRef> findAvailableRooms(
            Integer semesterId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo,
            Integer excludedScheduleId,
            String roomType,
            Integer requiredCapacity,
            Collection<Integer> excludedRoomIds,
            Integer limit
    ) {
        Collection<Integer> excludedIds = excludedRoomIds == null || excludedRoomIds.isEmpty()
                ? List.of(-1)
                : excludedRoomIds;
        return jdbc.query(
                """
                SELECT cr.classroom_id,
                       CONCAT(b.building_code, '-', cr.room_number) AS room_code,
                       cr.capacity,
                       cr.room_type,
                       cr.is_active,
                       cr.is_deleted
                FROM classrooms cr
                JOIN buildings b ON b.building_id = cr.building_id
                WHERE cr.is_active = TRUE
                  AND cr.is_deleted = FALSE
                  AND cr.room_type = :roomType
                  AND cr.capacity >= :requiredCapacity
                  AND cr.classroom_id NOT IN (:excludedRoomIds)
                  AND NOT EXISTS (
                      SELECT 1
                      FROM schedules sch
                      JOIN class_sections cs ON cs.section_id = sch.section_id
                      WHERE sch.classroom_id = cr.classroom_id
                        AND sch.status = 'ASSIGNED'
                        AND cs.status = 'ACTIVE'
                        AND cs.semester_id = :semesterId
                        AND sch.day_of_week = :dayOfWeek
                        AND sch.slot_start_id <= :slotEndId
                        AND sch.slot_end_id >= :slotStartId
                        AND COALESCE(sch.from_week_no, 1) <= COALESCE(:toWeekNo, 999)
                        AND COALESCE(:fromWeekNo, 1) <= COALESCE(sch.to_week_no, 999)
                        AND sch.schedule_id <> :excludedScheduleId
                  )
                ORDER BY cr.capacity ASC, b.building_code ASC, cr.room_number ASC
                LIMIT :limit
                """,
                new MapSqlParameterSource()
                        .addValue("semesterId", semesterId)
                        .addValue("dayOfWeek", dayOfWeek)
                        .addValue("slotStartId", slotStartId)
                        .addValue("slotEndId", slotEndId)
                        .addValue("fromWeekNo", fromWeekNo)
                        .addValue("toWeekNo", toWeekNo)
                        .addValue("excludedScheduleId", excludedScheduleId)
                        .addValue("roomType", roomType)
                        .addValue("requiredCapacity", requiredCapacity)
                        .addValue("excludedRoomIds", excludedIds)
                        .addValue("limit", limit == null ? 5 : limit),
                (rs, rowNum) -> new RoomRef(
                        rs.getInt("classroom_id"),
                        rs.getString("room_code"),
                        rs.getObject("capacity", Integer.class),
                        rs.getString("room_type"),
                        rs.getBoolean("is_active"),
                        rs.getBoolean("is_deleted")
                )
        );
    }

    @Override
    public List<SlotRangeRef> findSlotRanges(Integer slotSpan) {
        return jdbc.query(
                """
                SELECT start_slot.slot_id AS start_id,
                       end_slot.slot_id AS end_id,
                       start_slot.slot_no AS start_no,
                       end_slot.slot_no AS end_no
                FROM time_slots start_slot
                JOIN time_slots end_slot ON end_slot.slot_no = start_slot.slot_no + :slotSpan - 1
                WHERE :slotSpan > 0
                  AND end_slot.end_time > start_slot.start_time
                ORDER BY start_slot.slot_no ASC
                """,
                new MapSqlParameterSource("slotSpan", slotSpan),
                (rs, rowNum) -> new SlotRangeRef(
                        rs.getInt("start_id"),
                        rs.getInt("end_id"),
                        rs.getInt("start_no"),
                        rs.getInt("end_no")
                )
        );
    }

    @Override
    public WeekBoundsRef findWeekBounds(Integer semesterId) {
        return jdbc.queryForObject(
                """
                SELECT MIN(week_no) AS min_week_no, MAX(week_no) AS max_week_no
                FROM semester_weeks
                WHERE semester_id = :semesterId
                """,
                new MapSqlParameterSource("semesterId", semesterId),
                (rs, rowNum) -> new WeekBoundsRef(
                        rs.getObject("min_week_no", Integer.class),
                        rs.getObject("max_week_no", Integer.class)
                )
        );
    }

    @Override
    public int countCalendarBlockConflicts(
            Integer semesterId,
            String dayOfWeek,
            Integer fromWeekNo,
            Integer toWeekNo
    ) {
        Integer count = jdbc.queryForObject(
                """
                SELECT COUNT(DISTINCT acb.calendar_block_id)
                FROM semester_weeks sw
                JOIN academic_calendar_blocks acb
                  ON acb.semester_id = sw.semester_id
                 AND acb.is_teaching_allowed = FALSE
                WHERE sw.semester_id = :semesterId
                  AND sw.week_no BETWEEN COALESCE(:fromWeekNo, 1) AND COALESCE(:toWeekNo, 999)
                  AND DATE_ADD(
                        sw.start_date,
                        INTERVAL MOD(
                            (CASE :dayOfWeek
                                WHEN 'MON' THEN 0 WHEN 'TUE' THEN 1 WHEN 'WED' THEN 2
                                WHEN 'THU' THEN 3 WHEN 'FRI' THEN 4 WHEN 'SAT' THEN 5
                                WHEN 'SUN' THEN 6 END) - WEEKDAY(sw.start_date) + 7,
                            7
                        ) DAY
                      ) <= sw.end_date
                  AND DATE_ADD(
                        sw.start_date,
                        INTERVAL MOD(
                            (CASE :dayOfWeek
                                WHEN 'MON' THEN 0 WHEN 'TUE' THEN 1 WHEN 'WED' THEN 2
                                WHEN 'THU' THEN 3 WHEN 'FRI' THEN 4 WHEN 'SAT' THEN 5
                                WHEN 'SUN' THEN 6 END) - WEEKDAY(sw.start_date) + 7,
                            7
                        ) DAY
                      ) BETWEEN acb.start_date AND acb.end_date
                """,
                new MapSqlParameterSource()
                        .addValue("semesterId", semesterId)
                        .addValue("dayOfWeek", dayOfWeek)
                        .addValue("fromWeekNo", fromWeekNo)
                        .addValue("toWeekNo", toWeekNo),
                Integer.class
        );
        return count == null ? 0 : count;
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
            Integer classroomId,
            Integer assignedBy,
            String note
    ) {
        return jdbc.update(
                """
                UPDATE schedules
                SET classroom_id = :classroomId,
                    day_of_week = :dayOfWeek,
                    slot_start_id = :slotStartId,
                    slot_end_id = :slotEndId,
                    start_time = (SELECT start_time FROM time_slots WHERE slot_id = :slotStartId),
                    end_time = (SELECT end_time FROM time_slots WHERE slot_id = :slotEndId),
                    assigned_by = CASE WHEN :classroomId IS NULL THEN NULL ELSE :assignedBy END,
                    assigned_at = CASE WHEN :classroomId IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
                    status = CASE WHEN :classroomId IS NULL THEN 'UNASSIGNED' ELSE 'ASSIGNED' END,
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
                        .addValue("classroomId", classroomId)
                        .addValue("assignedBy", assignedBy)
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
        List<Integer> cancelledSectionIds = jdbc.query(
                """
                SELECT section_id
                FROM class_sections
                WHERE semester_id = :semesterId
                  AND course_id = :courseId
                  AND UPPER(section_code) = UPPER(:sectionCode)
                  AND status = 'CANCELLED'
                LIMIT 1
                """,
                new MapSqlParameterSource()
                        .addValue("semesterId", context.semesterId())
                        .addValue("courseId", context.courseId())
                        .addValue("sectionCode", sectionCode),
                (rs, rowNum) -> rs.getInt("section_id")
        );

        if (!cancelledSectionIds.isEmpty()) {
            Integer sectionId = cancelledSectionIds.get(0);

            jdbc.update(
                    """
                    UPDATE class_sections
                    SET lecturer_id = :lecturerId,
                        class_name = :className,
                        enrolled_count = :studentCount,
                        max_capacity = :studentCount,
                        import_source = 'ADMIN_SPLIT',
                        status = 'ACTIVE'
                    WHERE section_id = :sectionId
                    """,
                    new MapSqlParameterSource()
                            .addValue("sectionId", sectionId)
                            .addValue("lecturerId", lecturerId)
                            .addValue("className", context.className())
                            .addValue("studentCount", studentCount)
            );

            jdbc.update(
                    """
                    UPDATE schedules
                    SET status = 'CANCELLED',
                        validation_status = 'NOT_CHECKED',
                        conflict_reason = NULL
                    WHERE section_id = :sectionId
                    """,
                    new MapSqlParameterSource("sectionId", sectionId)
            );

            return sectionId;
        }

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

        if (keys.getKey() == null) {
            throw new IllegalStateException("Database did not return section_id");
        }

        return keys.getKey().intValue();
    }

    @Override
    public Integer insertSchedule(
            Integer sectionId,
            SplitContext context,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer classroomId,
            Integer assignedBy,
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
                    :sectionId, :classroomId, :dayOfWeek, start_slot.slot_id, end_slot.slot_id,
                    start_slot.start_time, end_slot.end_time, :fromWeekNo, :toWeekNo, :sessionType,
                    :practiceGroupNo,
                    CASE WHEN :classroomId IS NULL THEN NULL ELSE :assignedBy END,
                    CASE WHEN :classroomId IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
                    'NOT_CHECKED',
                    NULL,
                    CASE WHEN :classroomId IS NULL THEN 'UNASSIGNED' ELSE 'ASSIGNED' END,
                    :note
                FROM time_slots start_slot
                JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
                WHERE start_slot.slot_id = :slotStartId
                """,
                new MapSqlParameterSource()
                        .addValue("sectionId", sectionId)
                        .addValue("dayOfWeek", dayOfWeek)
                        .addValue("slotStartId", slotStartId)
                        .addValue("slotEndId", slotEndId)
                        .addValue("classroomId", classroomId)
                        .addValue("assignedBy", assignedBy)
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

    @Override
    public int countLecturerEligibleForCourse(Integer lecturerId, Integer courseId) {
        Integer count = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM lecturers l
            JOIN courses c ON c.department_id = l.department_id
            WHERE l.lecturer_id = :lecturerId
              AND c.course_id = :courseId
              AND l.is_deleted = FALSE
            """,
                Map.of(
                        "lecturerId", lecturerId,
                        "courseId", courseId
                ),
                Integer.class
        );
        return count == null ? 0 : count;
    }

    @Override
    public List<LecturerRef> findEligibleLecturersByCourse(Integer courseId) {
        return jdbc.query("""
            SELECT
                l.lecturer_id AS lecturerId,
                l.lecturer_code AS lecturerCode,
                l.full_name AS fullName,
                l.department_id AS departmentId
            FROM lecturers l
            JOIN courses c ON c.department_id = l.department_id
            WHERE c.course_id = :courseId
              AND l.is_deleted = FALSE
            ORDER BY l.lecturer_code
            """,
                Map.of("courseId", courseId),
                (rs, rowNum) -> new LecturerRef(
                        rs.getInt("lecturerId"),
                        rs.getString("lecturerCode"),
                        rs.getString("fullName"),
                        rs.getInt("departmentId")
                )
        );
    }
}
