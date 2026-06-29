package com.ptit.qlphonghoc.timetableworkflow.repository;

import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class TimetableWorkflowRepository implements TimetableWorkflowStore {

    private final JdbcTemplate jdbcTemplate;

    public TimetableWorkflowRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<SemesterWorkflowState> findSemester(Integer semesterId, boolean forUpdate) {
        String sql = """
                SELECT semester_id, semester_name, timetable_status
                FROM semesters
                WHERE semester_id = ?
                  AND is_deleted = FALSE
                """ + (forUpdate ? " FOR UPDATE" : "");
        List<SemesterWorkflowState> rows = jdbcTemplate.query(
                sql,
                (resultSet, rowNum) -> new SemesterWorkflowState(
                        resultSet.getInt("semester_id"),
                        resultSet.getString("semester_name"),
                        TimetableWorkflowStatus.valueOf(resultSet.getString("timetable_status"))
                ),
                semesterId
        );
        return rows.stream().findFirst();
    }

    @Override
    public int updateStatus(Integer semesterId, TimetableWorkflowStatus status) {
        return jdbcTemplate.update(
                "UPDATE semesters SET timetable_status = ? WHERE semester_id = ? AND is_deleted = FALSE",
                status.name(),
                semesterId
        );
    }

    @Override
    public ValidationCounts findValidationCounts(Integer semesterId) {
        String sql = """
                SELECT COUNT(*) AS totalSchedules,
                       COALESCE(SUM(sch.validation_status = 'VALID'), 0) AS validCount,
                       COALESCE(SUM(sch.validation_status = 'CONFLICT'), 0) AS conflictCount
                FROM schedules sch
                JOIN class_sections cs ON cs.section_id = sch.section_id
                WHERE cs.semester_id = ?
                  AND cs.status = 'ACTIVE'
                  AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
                """;
        return jdbcTemplate.queryForObject(
                sql,
                (resultSet, rowNum) -> new ValidationCounts(
                        resultSet.getInt("totalSchedules"),
                        resultSet.getInt("validCount"),
                        resultSet.getInt("conflictCount")
                ),
                semesterId
        );
    }

    public record SemesterWorkflowState(
            Integer semesterId,
            String semesterName,
            TimetableWorkflowStatus status
    ) {
        public SemesterWorkflowState withStatus(TimetableWorkflowStatus newStatus) {
            return new SemesterWorkflowState(semesterId, semesterName, newStatus);
        }
    }

    public record ValidationCounts(int totalSchedules, int validCount, int conflictCount) {
    }
}
