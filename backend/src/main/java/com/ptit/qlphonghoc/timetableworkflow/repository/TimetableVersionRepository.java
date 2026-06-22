package com.ptit.qlphonghoc.timetableworkflow.repository;

import com.ptit.qlphonghoc.timetableworkflow.entity.TimetableVersion;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Repository
public class TimetableVersionRepository {

    private final JdbcTemplate jdbcTemplate;

    public TimetableVersionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int save(Long semesterId, Integer versionNo, Integer userId, String summary) {
        String sql = """
                INSERT INTO timetable_versions (semester_id, version_no, created_by, created_at, summary)
                VALUES (?, ?, ?, ?, ?)
                """;
        return jdbcTemplate.update(sql, semesterId, versionNo, userId, Timestamp.valueOf(LocalDateTime.now()), summary);
    }

    public Integer findMaxVersionNo(Long semesterId) {
        String sql = "SELECT MAX(version_no) FROM timetable_versions WHERE semester_id = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, semesterId);
    }

    public List<TimetableVersion> findAll(Integer semesterId, String search) {
        StringBuilder sql = new StringBuilder("""
                SELECT tv.version_id,
                       tv.semester_id,
                       s.semester_code,
                       s.semester_name,
                       tv.version_no,
                       tv.created_by,
                       COALESCE(l.full_name, u.username) AS created_by_name,
                       tv.created_at,
                       tv.summary
                FROM timetable_versions tv
                JOIN semesters s ON tv.semester_id = s.semester_id
                JOIN users u ON tv.created_by = u.user_id
                LEFT JOIN lecturers l ON u.user_id = l.user_id
                WHERE 1 = 1
                """);
        List<Object> params = new ArrayList<>();

        if (semesterId != null) {
            sql.append(" AND tv.semester_id = ?");
            params.add(semesterId);
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append(" AND (tv.summary LIKE ? OR u.username LIKE ? OR l.full_name LIKE ?)");
            String searchPattern = "%" + search.trim() + "%";
            params.add(searchPattern);
            params.add(searchPattern);
            params.add(searchPattern);
        }

        sql.append(" ORDER BY tv.semester_id DESC, tv.version_no DESC");

        return jdbcTemplate.query(sql.toString(), new TimetableVersionRowMapper(), params.toArray());
    }

    private static class TimetableVersionRowMapper implements RowMapper<TimetableVersion> {
        @Override
        public TimetableVersion mapRow(ResultSet rs, int rowNum) throws SQLException {
            Timestamp ts = rs.getTimestamp("created_at");
            LocalDateTime createdAt = ts != null ? ts.toLocalDateTime() : null;
            return new TimetableVersion(
                    rs.getLong("version_id"),
                    rs.getLong("semester_id"),
                    rs.getString("semester_code"),
                    rs.getString("semester_name"),
                    rs.getInt("version_no"),
                    rs.getInt("created_by"),
                    rs.getString("created_by_name"),
                    createdAt,
                    rs.getString("summary")
            );
        }
    }
}
