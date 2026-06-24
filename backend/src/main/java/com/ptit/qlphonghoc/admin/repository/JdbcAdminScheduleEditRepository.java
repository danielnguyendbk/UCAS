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
        List<ScheduleEditContext> rows = jdbcTemplate.query(
                """
                SELECT cs.semester_id,
                       sem.timetable_status,
                       cs.enrolled_count
                FROM schedules sch
                JOIN class_sections cs ON cs.section_id = sch.section_id
                JOIN semesters sem ON sem.semester_id = cs.semester_id
                WHERE cs.section_id = ?
                  AND sch.schedule_id = ?
                  AND cs.status <> 'CANCELLED'
                  AND sch.status <> 'CANCELLED'
                FOR UPDATE
                """,
                (rs, rowNum) -> new ScheduleEditContext(
                        rs.getInt("semester_id"),
                        rs.getString("timetable_status"),
                        rs.getInt("enrolled_count")
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
