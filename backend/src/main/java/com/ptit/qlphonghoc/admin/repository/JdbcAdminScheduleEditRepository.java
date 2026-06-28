package com.ptit.qlphonghoc.admin.repository;

import com.ptit.qlphonghoc.admin.dto.AdminScheduleUpdateRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class JdbcAdminScheduleEditRepository implements AdminScheduleEditRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcAdminScheduleEditRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<ScheduleEditContext> findContextForUpdate(Integer sectionId, Integer scheduleId) {
        return findContext(sectionId, scheduleId, true);
    }

    @Override
    public Optional<ScheduleEditContext> findContext(Integer sectionId, Integer scheduleId) {
        return findContext(sectionId, scheduleId, false);
    }

    private Optional<ScheduleEditContext> findContext(Integer sectionId, Integer scheduleId, boolean forUpdate) {
        List<ScheduleEditContext> rows = jdbcTemplate.query(
                ("""
                SELECT cs.semester_id,
                       sem.timetable_status,
                       cs.enrolled_count,
                       c.required_room_type
                FROM schedules sch
                JOIN class_sections cs ON cs.section_id = sch.section_id
                JOIN courses c ON c.course_id = cs.course_id
                JOIN semesters sem ON sem.semester_id = cs.semester_id
                WHERE cs.section_id = ?
                  AND sch.schedule_id = ?
                  AND cs.status <> 'CANCELLED'
                  AND sch.status <> 'CANCELLED'
                """ + (forUpdate ? " FOR UPDATE" : "")),
                (rs, rowNum) -> new ScheduleEditContext(
                        rs.getInt("semester_id"),
                        rs.getString("timetable_status"),
                        rs.getInt("enrolled_count"),
                        rs.getString("required_room_type")
                ),
                sectionId,
                scheduleId
        );
        return rows.stream().findFirst();
    }

    @Override
    public boolean lecturerExists(Integer lecturerId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM lecturers WHERE lecturer_id = ? AND is_deleted = FALSE",
                Integer.class,
                lecturerId
        );
        return count != null && count > 0;
    }

    @Override
    public boolean classroomIsActive(Integer classroomId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM classrooms
                WHERE classroom_id = ?
                  AND is_active = TRUE
                  AND is_deleted = FALSE
                """,
                Integer.class,
                classroomId
        );
        return count != null && count > 0;
    }

    @Override
    public boolean slotRangeIsValid(Integer slotStartId, Integer slotEndId) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM time_slots start_slot
                JOIN time_slots end_slot ON end_slot.slot_id = ?
                WHERE start_slot.slot_id = ?
                  AND end_slot.slot_no >= start_slot.slot_no
                  AND end_slot.end_time > start_slot.start_time
                """,
                Integer.class,
                slotEndId,
                slotStartId
        );
        return count != null && count > 0;
    }

    @Override
    public Optional<RoomEditRef> findRoom(Integer classroomId) {
        List<RoomEditRef> rows = jdbcTemplate.query(
                """
                SELECT cr.classroom_id,
                       CONCAT(b.building_code, '-', cr.room_number) AS room_code,
                       cr.capacity,
                       cr.room_type,
                       cr.is_active,
                       cr.is_deleted
                FROM classrooms cr
                JOIN buildings b ON b.building_id = cr.building_id
                WHERE cr.classroom_id = ?
                """,
                (rs, rowNum) -> new RoomEditRef(
                        rs.getInt("classroom_id"),
                        rs.getString("room_code"),
                        rs.getInt("capacity"),
                        rs.getString("room_type"),
                        rs.getBoolean("is_active"),
                        rs.getBoolean("is_deleted")
                ),
                classroomId
        );
        return rows.stream().findFirst();
    }

    @Override
    public int countRoomTimeConflicts(
            Integer scheduleId,
            Integer classroomId,
            Integer semesterId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo
    ) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM schedules sch2
                JOIN class_sections cs2 ON cs2.section_id = sch2.section_id
                WHERE sch2.classroom_id = ?
                  AND sch2.schedule_id <> ?
                  AND sch2.status = 'ASSIGNED'
                  AND cs2.status = 'ACTIVE'
                  AND cs2.semester_id = ?
                  AND sch2.day_of_week = ?
                  AND sch2.slot_start_id <= ?
                  AND sch2.slot_end_id >= ?
                  AND COALESCE(sch2.from_week_no, 1) <= COALESCE(?, 999)
                  AND COALESCE(?, 1) <= COALESCE(sch2.to_week_no, 999)
                """,
                Integer.class,
                classroomId,
                scheduleId,
                semesterId,
                dayOfWeek,
                slotEndId,
                slotStartId,
                toWeekNo,
                fromWeekNo
        );
        return count == null ? 0 : count;
    }

    @Override
    public List<AvailableRoomRef> findAvailableRooms(
            Integer semesterId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo,
            Integer excludedScheduleId,
            Integer expectedAttendees,
            String roomType,
            Integer buildingId
    ) {
        return jdbcTemplate.query(
                """
                SELECT cr.classroom_id AS classroom_id,
                       cr.building_id AS building_id,
                       b.building_code AS building_code,
                       b.building_name AS building_name,
                       CONCAT(b.building_code, '-', cr.room_number) AS room_code,
                       cr.capacity AS capacity,
                       cr.room_type AS room_type,
                       CASE cr.room_type
                           WHEN 'LECTURE' THEN 'Phong hoc'
                           WHEN 'LAB' THEN 'Phong may'
                           WHEN 'SEMINAR' THEN 'Phong seminar'
                           WHEN 'AUDITORIUM' THEN 'Hoi truong nho'
                           ELSE cr.room_type
                       END AS room_type_text,
                       CASE cr.room_type
                           WHEN 'LAB' THEN 'May tinh, Máy lạnh'
                           WHEN 'SEMINAR' THEN 'Micro, Tivi, Máy lạnh'
                           WHEN 'LECTURE' THEN 'Micro, Tivi, Máy lạnh'
                           WHEN 'AUDITORIUM' THEN 'Micro, May chieu, Máy lạnh'
                           ELSE 'Khong co'
                       END AS main_equipment
                FROM classrooms cr
                JOIN buildings b ON b.building_id = cr.building_id
                WHERE cr.is_active = TRUE
                  AND cr.is_deleted = FALSE
                  AND cr.capacity >= ?
                  AND (? IS NULL OR ? = '' OR cr.room_type = ?)
                  AND (? IS NULL OR cr.building_id = ?)
                  AND NOT EXISTS (
                      SELECT 1
                      FROM schedules sch
                      JOIN class_sections cs ON cs.section_id = sch.section_id
                      WHERE sch.classroom_id = cr.classroom_id
                        AND sch.status = 'ASSIGNED'
                        AND cs.status = 'ACTIVE'
                        AND cs.semester_id = ?
                        AND sch.day_of_week = ?
                        AND sch.slot_start_id <= ?
                        AND sch.slot_end_id >= ?
                        AND COALESCE(sch.from_week_no, 1) <= COALESCE(?, 999)
                        AND COALESCE(?, 1) <= COALESCE(sch.to_week_no, 999)
                        AND (? IS NULL OR sch.schedule_id <> ?)
                  )
                ORDER BY cr.capacity ASC
                """,
                (rs, rowNum) -> new AvailableRoomRef(
                        rs.getInt("classroom_id"),
                        rs.getInt("building_id"),
                        rs.getString("building_code"),
                        rs.getString("building_name"),
                        rs.getString("room_code"),
                        rs.getInt("capacity"),
                        rs.getString("room_type"),
                        rs.getString("room_type_text"),
                        rs.getString("main_equipment")
                ),
                expectedAttendees,
                roomType,
                roomType,
                roomType,
                buildingId,
                buildingId,
                semesterId,
                dayOfWeek,
                slotEndId,
                slotStartId,
                toWeekNo,
                fromWeekNo,
                excludedScheduleId,
                excludedScheduleId
        );
    }

    @Override
    public int updateSection(Integer sectionId, Integer lecturerId, Integer maxCapacity) {
        return jdbcTemplate.update(
                """
                UPDATE class_sections
                SET lecturer_id = COALESCE(?, lecturer_id),
                    max_capacity = COALESCE(?, max_capacity)
                WHERE section_id = ?
                """,
                lecturerId,
                maxCapacity,
                sectionId
        );
    }

    @Override
    public int updateSchedule(
            Integer sectionId,
            Integer scheduleId,
            AdminScheduleUpdateRequest request,
            String dayOfWeek,
            Integer adminUserId,
            String note
    ) {
        return jdbcTemplate.update(
                """
                UPDATE schedules
                SET classroom_id = ?,
                    day_of_week = ?,
                    slot_start_id = ?,
                    slot_end_id = ?,
                    start_time = (SELECT start_time FROM time_slots WHERE slot_id = ?),
                    end_time = (SELECT end_time FROM time_slots WHERE slot_id = ?),
                    from_week_no = ?,
                    to_week_no = ?,
                    note = ?,
                    assigned_by = CASE WHEN ? IS NULL THEN NULL ELSE ? END,
                    assigned_at = CASE WHEN ? IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
                    status = CASE WHEN ? IS NULL THEN 'UNASSIGNED' ELSE 'ASSIGNED' END,
                    validation_status = 'NOT_CHECKED',
                    conflict_reason = NULL
                WHERE schedule_id = ?
                  AND section_id = ?
                  AND status <> 'CANCELLED'
                """,
                request.classroomId(),
                dayOfWeek,
                request.slotStartId(),
                request.slotEndId(),
                request.slotStartId(),
                request.slotEndId(),
                request.fromWeekNo(),
                request.toWeekNo(),
                note,
                request.classroomId(),
                adminUserId,
                request.classroomId(),
                request.classroomId(),
                scheduleId,
                sectionId
        );
    }

    @Override
    public int markSemesterDraft(Integer semesterId) {
        return jdbcTemplate.update(
                "UPDATE semesters SET timetable_status = 'DRAFT' WHERE semester_id = ?",
                semesterId
        );
    }
}
