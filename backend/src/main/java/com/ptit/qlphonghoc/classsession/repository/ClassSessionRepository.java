package com.ptit.qlphonghoc.classsession.repository;

import com.ptit.qlphonghoc.classsession.dto.ClassSessionResponse;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Repository
public class ClassSessionRepository {

    private final JdbcTemplate jdbcTemplate;

    public ClassSessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final String BASE_SQL = """
        SELECT
            cs.class_session_id AS classSessionId,
            cs.schedule_id AS scheduleId,
            cs.section_id AS sectionId,
            c.course_code AS courseCode,
            c.course_name AS courseName,
            sec.section_code AS sectionCode,
            CONCAT(c.course_code, '.L', sec.section_code) AS classCode,
            sec.class_name AS className,
            cs.lecturer_id AS lecturerId,
            l.full_name AS lecturerName,
            COALESCE(trc_eff.new_classroom_id, cs.classroom_id) AS roomId,
            CASE
                WHEN trc_eff.new_classroom_id IS NOT NULL THEN CONCAT(eff_b.building_code, '-', eff_cr.room_number)
                WHEN cs.classroom_id IS NULL THEN NULL
                ELSE CONCAT(b.building_code, '-', cr.room_number)
            END AS roomCode,
            cs.session_date AS sessionDate,
            sw.week_no AS weekNo,
            ts_start.slot_no AS slotStart,
            ts_end.slot_no AS slotEnd,
            DATE_FORMAT(cs.start_time, '%H:%i') AS startTime,
            DATE_FORMAT(cs.end_time, '%H:%i') AS endTime,
            cs.session_type AS sessionType,
            cs.practice_group_no AS practiceGroupNo,
            cs.session_status AS sessionStatus,
            cs.note AS note
        FROM class_sessions cs
        JOIN class_sections sec ON sec.section_id = cs.section_id
        JOIN courses c ON c.course_id = sec.course_id
        JOIN semester_weeks sw ON sw.semester_week_id = cs.semester_week_id
        JOIN time_slots ts_start ON ts_start.slot_id = cs.slot_start_id
        JOIN time_slots ts_end ON ts_end.slot_id = cs.slot_end_id
        LEFT JOIN lecturers l ON l.lecturer_id = cs.lecturer_id
        LEFT JOIN classrooms cr ON cr.classroom_id = cs.classroom_id
        LEFT JOIN buildings b ON b.building_id = cr.building_id
        JOIN semesters sem ON sem.semester_id = sec.semester_id
        LEFT JOIN temporary_room_changes trc_eff
            ON trc_eff.room_change_id = (
                SELECT trc_s.room_change_id
                FROM temporary_room_changes trc_s
                WHERE trc_s.schedule_id = cs.schedule_id
                  AND trc_s.status = 'APPROVED'
                  AND trc_s.is_active = TRUE
                  AND trc_s.new_classroom_id IS NOT NULL
                  AND (
                      (trc_s.change_scope = 'SESSION' AND trc_s.target_date = cs.session_date)
                      OR (trc_s.change_scope IN ('WEEK_RANGE', 'REST_OF_SEMESTER')
                          AND sw.week_no BETWEEN trc_s.from_week AND COALESCE(trc_s.to_week, 999))
                  )
                ORDER BY
                    CASE trc_s.change_scope WHEN 'SESSION' THEN 1 WHEN 'WEEK_RANGE' THEN 2 ELSE 3 END,
                    trc_s.room_change_id DESC
                LIMIT 1
            )
        LEFT JOIN classrooms eff_cr ON eff_cr.classroom_id = trc_eff.new_classroom_id
        LEFT JOIN buildings eff_b ON eff_b.building_id = eff_cr.building_id
        """;

    public List<ClassSessionResponse> findClassSessions(
            Integer semesterId,
            Integer weekNo,
            String status,
            Integer lecturerId,
            Integer classroomId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Integer studentId,
            Integer strictLecturerId
    ) {
        StringBuilder sql = new StringBuilder(BASE_SQL);
        List<Object> params = new ArrayList<>();

        sql.append(" WHERE sem.is_deleted = FALSE ");

        if (studentId != null) {
            sql.append(" AND cs.section_id IN (SELECT sse.section_id FROM student_section_enrollments sse WHERE sse.student_id = ? AND sse.status = 'ENROLLED') ");
            params.add(studentId);
        }

        if (strictLecturerId != null) {
            sql.append(" AND cs.lecturer_id = ? ");
            params.add(strictLecturerId);
        }

        if (semesterId != null) {
            sql.append(" AND sec.semester_id = ? ");
            params.add(semesterId);
        }

        if (weekNo != null) {
            sql.append(" AND sw.week_no = ? ");
            params.add(weekNo);
        }

        if (classroomId != null) {
            sql.append(" AND cs.classroom_id = ? ");
            params.add(classroomId);
        }

        if (lecturerId != null) {
            sql.append(" AND cs.lecturer_id = ? ");
            params.add(lecturerId);
        }

        if (date != null) {
            sql.append(" AND cs.session_date = ? ");
            params.add(java.sql.Date.valueOf(date));
        }

        if (startDate != null) {
            sql.append(" AND cs.session_date >= ? ");
            params.add(java.sql.Date.valueOf(startDate));
        }

        if (endDate != null) {
            sql.append(" AND cs.session_date <= ? ");
            params.add(java.sql.Date.valueOf(endDate));
        }

        if (status != null && !status.isBlank()) {
            String normStatus = status.trim().toUpperCase();
            if ("PLANNED".equals(normStatus)) {
                sql.append(" AND cs.session_status IN ('SCHEDULED', 'MAKEUP', 'RESCHEDULED') ");
            } else if ("COMPLETED".equals(normStatus)) {
                sql.append(" AND cs.session_status = 'COMPLETED' ");
            } else if ("CANCELLED".equals(normStatus)) {
                sql.append(" AND cs.session_status = 'CANCELLED' ");
            } else {
                sql.append(" AND cs.session_status = ? ");
                params.add(normStatus);
            }
        }

        if (search != null && !search.isBlank()) {
            String likePattern = "%" + search.trim().toLowerCase() + "%";
            sql.append("""
                AND (LOWER(c.course_code) LIKE ?
                     OR LOWER(c.course_name) LIKE ?
                     OR LOWER(sec.section_code) LIKE ?
                     OR LOWER(sec.class_name) LIKE ?
                     OR LOWER(l.full_name) LIKE ?
                     OR LOWER(CONCAT(b.building_code, '-', cr.room_number)) LIKE ?)
                """);
            for (int i = 0; i < 6; i++) {
                params.add(likePattern);
            }
        }

        sql.append(" ORDER BY cs.session_date ASC, ts_start.slot_no ASC, c.course_code ASC ");

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
            String dbStatus = rs.getString("sessionStatus");
            String apiStatus = switch (dbStatus) {
                case "SCHEDULED", "MAKEUP", "RESCHEDULED" -> "PLANNED";
                case "COMPLETED" -> "COMPLETED";
                case "CANCELLED" -> "CANCELLED";
                default -> dbStatus;
            };

            java.sql.Date sqlDate = rs.getDate("sessionDate");
            LocalDate sessionLocalDate = sqlDate != null ? sqlDate.toLocalDate() : null;

            return new ClassSessionResponse(
                    rs.getLong("classSessionId"),
                    rs.getObject("scheduleId") != null ? rs.getLong("scheduleId") : null,
                    rs.getLong("sectionId"),
                    rs.getString("courseCode"),
                    rs.getString("courseName"),
                    rs.getString("sectionCode"),
                    rs.getString("classCode"),
                    rs.getString("className"),
                    rs.getObject("lecturerId") != null ? rs.getLong("lecturerId") : null,
                    rs.getString("lecturerName"),
                    rs.getObject("roomId") != null ? rs.getLong("roomId") : null,
                    rs.getString("roomCode"),
                    sessionLocalDate,
                    rs.getInt("weekNo"),
                    rs.getInt("slotStart"),
                    rs.getInt("slotEnd"),
                    rs.getString("startTime"),
                    rs.getString("endTime"),
                    rs.getString("sessionType"),
                    rs.getInt("practiceGroupNo"),
                    apiStatus,
                    rs.getString("note")
            );
        }, params.toArray());
    }

    public List<ScheduleInfo> getActiveSchedules(Integer semesterId) {
        String sql = """
            SELECT
                sch.schedule_id,
                sch.section_id,
                sch.classroom_id,
                sch.day_of_week,
                sch.slot_start_id,
                sch.slot_end_id,
                sch.start_time,
                sch.end_time,
                sch.from_week_no,
                sch.to_week_no,
                sch.session_type,
                sch.practice_group_no,
                cs.lecturer_id
            FROM schedules sch
            JOIN class_sections cs ON cs.section_id = sch.section_id
            WHERE cs.semester_id = ?
              AND cs.status = 'ACTIVE'
              AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            java.sql.Time startTime = rs.getTime("start_time");
            java.sql.Time endTime = rs.getTime("end_time");
            return new ScheduleInfo(
                    rs.getLong("schedule_id"),
                    rs.getLong("section_id"),
                    rs.getObject("classroom_id") != null ? rs.getLong("classroom_id") : null,
                    rs.getString("day_of_week"),
                    rs.getLong("slot_start_id"),
                    rs.getLong("slot_end_id"),
                    startTime != null ? startTime.toLocalTime() : null,
                    endTime != null ? endTime.toLocalTime() : null,
                    rs.getObject("from_week_no") != null ? rs.getInt("from_week_no") : null,
                    rs.getObject("to_week_no") != null ? rs.getInt("to_week_no") : null,
                    rs.getString("session_type"),
                    rs.getInt("practice_group_no"),
                    rs.getObject("lecturer_id") != null ? rs.getLong("lecturer_id") : null
            );
        }, semesterId);
    }

    public List<SemesterWeekInfo> getSemesterWeeks(Integer semesterId) {
        String sql = """
            SELECT semester_week_id, week_no, start_date, end_date, is_break
            FROM semester_weeks
            WHERE semester_id = ?
            ORDER BY week_no ASC
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            java.sql.Date startDate = rs.getDate("start_date");
            java.sql.Date endDate = rs.getDate("end_date");
            return new SemesterWeekInfo(
                    rs.getLong("semester_week_id"),
                    rs.getInt("week_no"),
                    startDate != null ? startDate.toLocalDate() : null,
                    endDate != null ? endDate.toLocalDate() : null,
                    rs.getBoolean("is_break")
            );
        }, semesterId);
    }

    public List<CalendarBlockInfo> getCalendarBlocks(Integer semesterId) {
        String sql = """
            SELECT start_date, end_date, title
            FROM academic_calendar_blocks
            WHERE semester_id = ?
              AND is_teaching_allowed = FALSE
            """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            java.sql.Date startDate = rs.getDate("start_date");
            java.sql.Date endDate = rs.getDate("end_date");
            return new CalendarBlockInfo(
                    startDate != null ? startDate.toLocalDate() : null,
                    endDate != null ? endDate.toLocalDate() : null,
                    rs.getString("title")
            );
        }, semesterId);
    }

    public int deleteScheduledSessions(Integer semesterId) {
        String sql = """
            DELETE FROM class_sessions
            WHERE section_id IN (SELECT section_id FROM class_sections WHERE semester_id = ?)
              AND session_status = 'SCHEDULED'
            """;
        return jdbcTemplate.update(sql, semesterId);
    }

    public void batchInsertClassSessions(List<ClassSessionInsertData> sessions) {
        String sql = """
            INSERT INTO class_sessions (
                schedule_id, section_id, semester_week_id, session_date,
                classroom_id, lecturer_id, slot_start_id, slot_end_id,
                start_time, end_time, session_type, practice_group_no,
                session_status, note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ClassSessionInsertData data = sessions.get(i);
                if (data.scheduleId() != null) {
                    ps.setLong(1, data.scheduleId());
                } else {
                    ps.setNull(1, java.sql.Types.BIGINT);
                }
                ps.setLong(2, data.sectionId());
                ps.setLong(3, data.semesterWeekId());
                ps.setDate(4, java.sql.Date.valueOf(data.sessionDate()));
                if (data.classroomId() != null) {
                    ps.setLong(5, data.classroomId());
                } else {
                    ps.setNull(5, java.sql.Types.BIGINT);
                }
                if (data.lecturerId() != null) {
                    ps.setLong(6, data.lecturerId());
                } else {
                    ps.setNull(6, java.sql.Types.BIGINT);
                }
                ps.setLong(7, data.slotStartId());
                ps.setLong(8, data.slotEndId());
                ps.setTime(9, java.sql.Time.valueOf(data.startTime()));
                ps.setTime(10, java.sql.Time.valueOf(data.endTime()));
                ps.setString(11, data.sessionType());
                ps.setInt(12, data.practiceGroupNo());
                ps.setString(13, data.sessionStatus());
                ps.setString(14, data.note());
            }

            @Override
            public int getBatchSize() {
                return sessions.size();
            }
        });
    }

    public record ScheduleInfo(
            Long scheduleId,
            Long sectionId,
            Long classroomId,
            String dayOfWeek,
            Long slotStartId,
            Long slotEndId,
            LocalTime startTime,
            LocalTime endTime,
            Integer fromWeekNo,
            Integer toWeekNo,
            String sessionType,
            Integer practiceGroupNo,
            Long lecturerId
    ) {}

    public record SemesterWeekInfo(
            Long semesterWeekId,
            Integer weekNo,
            LocalDate startDate,
            LocalDate endDate,
            boolean isBreak
    ) {}

    public record CalendarBlockInfo(
            LocalDate startDate,
            LocalDate endDate,
            String title
    ) {}

    public record ClassSessionInsertData(
            Long scheduleId,
            Long sectionId,
            Long semesterWeekId,
            LocalDate sessionDate,
            Long classroomId,
            Long lecturerId,
            Long slotStartId,
            Long slotEndId,
            LocalTime startTime,
            LocalTime endTime,
            String sessionType,
            Integer practiceGroupNo,
            String sessionStatus,
            String note
    ) {}
}
