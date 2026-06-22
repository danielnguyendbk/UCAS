package com.ptit.qlphonghoc.timetableworkflow.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableDiffResult;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableDiffResult.ScheduleDiff;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableDiffResult.SectionDiff;
import com.ptit.qlphonghoc.timetableworkflow.entity.TimetableVersion;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableVersionRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TimetableVersionService {

    private final TimetableVersionRepository repository;
    private final JdbcTemplate jdbcTemplate;

    public TimetableVersionService(TimetableVersionRepository repository, JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public synchronized void createVersion(Long semesterId, Integer userId, String summary) {
        Integer maxVersion = repository.findMaxVersionNo(semesterId);
        int nextVersion = (maxVersion == null) ? 1 : maxVersion + 1;
        repository.save(semesterId, nextVersion, userId, summary);
    }

    @Transactional(readOnly = true)
    public List<TimetableVersion> getVersions(Integer semesterId, String search) {
        return repository.findAll(semesterId, search);
    }

    @Transactional(readOnly = true)
    public TimetableDiffResult computeDiff(Long semesterId, Integer versionNoA, Integer versionNoB) {
        TimetableVersion verA = repository.findByVersionNo(semesterId, versionNoA)
                .orElseThrow(() -> new BadRequestException("VERSION_NOT_FOUND",
                        "Không tìm thấy phiên bản " + versionNoA + " cho học kỳ này."));
        TimetableVersion verB = repository.findByVersionNo(semesterId, versionNoB)
                .orElseThrow(() -> new BadRequestException("VERSION_NOT_FOUND",
                        "Không tìm thấy phiên bản " + versionNoB + " cho học kỳ này."));

        // Ensure versionA < versionB (earlier to later)
        TimetableVersion earlier = verA.versionNo() <= verB.versionNo() ? verA : verB;
        TimetableVersion later   = verA.versionNo() <= verB.versionNo() ? verB : verA;

        LocalDateTime fromTime = earlier.createdAt();
        LocalDateTime toTime   = later.createdAt();

        List<SectionDiff> addedSections = querySectionDiff(semesterId, fromTime, toTime, true);
        List<SectionDiff> modifiedSections = querySectionDiff(semesterId, fromTime, toTime, false);
        List<ScheduleDiff> addedSchedules = queryScheduleDiff(semesterId, fromTime, toTime, "ADDED");
        List<ScheduleDiff> modifiedSchedules = queryScheduleDiff(semesterId, fromTime, toTime, "MODIFIED");
        List<ScheduleDiff> removedSchedules = queryScheduleDiff(semesterId, fromTime, toTime, "REMOVED");

        return new TimetableDiffResult(
                semesterId,
                later.semesterName(),
                earlier.versionNo(),
                later.versionNo(),
                addedSections,
                modifiedSections,
                addedSchedules,
                modifiedSchedules,
                removedSchedules
        );
    }

    /**
     * Query sections that were added (created between fromTime and toTime)
     * or modified (updated_at in window but created_at before window start).
     */
    private List<SectionDiff> querySectionDiff(Long semesterId, LocalDateTime fromTime, LocalDateTime toTime, boolean added) {
        String condition = added
                // newly created in this window
                ? "cs.created_at > ? AND cs.created_at <= ?"
                // updated in this window but existed before the window
                : "cs.updated_at > ? AND cs.updated_at <= ? AND cs.created_at <= ?";

        String sql = """
                SELECT cs.section_id,
                       cs.section_code,
                       cs.class_name,
                       c.course_code,
                       l.lecturer_code,
                       cs.status
                FROM class_sections cs
                JOIN courses c ON c.course_id = cs.course_id
                JOIN lecturers l ON l.lecturer_id = cs.lecturer_id
                WHERE cs.semester_id = ?
                  AND """ + condition + """
                ORDER BY c.course_code, cs.section_code
                """;

        Timestamp from = Timestamp.valueOf(fromTime);
        Timestamp to   = Timestamp.valueOf(toTime);

        Object[] params = added
                ? new Object[]{semesterId, from, to}
                : new Object[]{semesterId, from, to, from};

        return jdbcTemplate.query(sql, (rs, rowNum) -> new SectionDiff(
                rs.getLong("section_id"),
                rs.getString("section_code"),
                rs.getString("class_name"),
                rs.getString("course_code"),
                rs.getString("lecturer_code"),
                rs.getString("status")
        ), params);
    }

    /**
     * Query schedule changes in the window:
     * - ADDED:    created_at in window
     * - REMOVED:  status = CANCELLED AND updated_at in window
     * - MODIFIED: updated_at in window but created_at before window AND status != CANCELLED
     */
    private List<ScheduleDiff> queryScheduleDiff(Long semesterId, LocalDateTime fromTime, LocalDateTime toTime, String mode) {
        String condition = switch (mode) {
            case "ADDED"    -> "sch.created_at > ? AND sch.created_at <= ?";
            case "REMOVED"  -> "sch.status = 'CANCELLED' AND sch.updated_at > ? AND sch.updated_at <= ?";
            case "MODIFIED" -> "sch.status != 'CANCELLED' AND sch.updated_at > ? AND sch.updated_at <= ? AND sch.created_at <= ?";
            default -> throw new IllegalArgumentException("Unknown mode: " + mode);
        };

        String sql = """
                SELECT sch.schedule_id,
                       sch.section_id,
                       cs.section_code,
                       c.course_code,
                       sch.day_of_week,
                       ts_start.slot_label AS slot_start,
                       ts_end.slot_label   AS slot_end,
                       sch.session_type,
                       COALESCE(cr.classroom_code, '') AS classroom_code,
                       sch.status
                FROM schedules sch
                JOIN class_sections cs ON cs.section_id = sch.section_id
                JOIN courses c ON c.course_id = cs.course_id
                JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
                JOIN time_slots ts_end   ON ts_end.slot_id   = sch.slot_end_id
                LEFT JOIN classrooms cr ON cr.classroom_id = sch.classroom_id
                WHERE cs.semester_id = ?
                  AND """ + condition + """
                ORDER BY c.course_code, cs.section_code, sch.day_of_week, sch.slot_start_id
                """;

        Timestamp from = Timestamp.valueOf(fromTime);
        Timestamp to   = Timestamp.valueOf(toTime);

        Object[] params = mode.equals("MODIFIED")
                ? new Object[]{semesterId, from, to, from}
                : new Object[]{semesterId, from, to};

        return jdbcTemplate.query(sql, (rs, rowNum) -> new ScheduleDiff(
                rs.getLong("schedule_id"),
                rs.getLong("section_id"),
                rs.getString("section_code"),
                rs.getString("course_code"),
                rs.getString("day_of_week"),
                rs.getString("slot_start"),
                rs.getString("slot_end"),
                rs.getString("session_type"),
                rs.getString("classroom_code"),
                rs.getString("status")
        ), params);
    }
}
