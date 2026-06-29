package com.ptit.qlphonghoc.admin.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/calendar-blocks")
public class AdminCalendarBlockController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminCalendarBlockController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getCalendarBlocks(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) String type
    ) {
        String sql = """
            SELECT
                cb.calendar_block_id AS id,
                cb.semester_id AS semesterId,
                s.semester_code AS semesterCode,
                s.semester_name AS semesterName,
                cb.title,
                cb.block_type AS type,
                cb.start_date AS startDate,
                cb.end_date AS endDate,
                cb.is_teaching_allowed AS teachingAllowed,
                cb.note AS notes,
                'ACTIVE' AS status,
                cb.created_at AS createdAt,
                cb.updated_at AS updatedAt
            FROM academic_calendar_blocks cb
            JOIN semesters s ON s.semester_id = cb.semester_id AND s.is_deleted = FALSE
            WHERE (:semesterId IS NULL OR cb.semester_id = :semesterId)
              AND (:type IS NULL OR :type = '' OR cb.block_type = :type)
            ORDER BY cb.start_date ASC, cb.calendar_block_id ASC
            """;

        Map<String, Object> params = new HashMap<>();
        params.put("semesterId", semesterId);
        params.put("type", normalize(type));

        List<Map<String, Object>> blocks = jdbcTemplate.queryForList(sql, params);
        return ApiResponse.success("OK", blocks);
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createCalendarBlock(@RequestBody Map<String, Object> body) {
        Object semesterId = body.get("semesterId");
        Object title = body.get("title");
        Object type = body.get("type");
        Object startDate = body.get("startDate");
        Object endDate = body.get("endDate");

        if (semesterId == null || isBlank(title) || isBlank(type) || startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc: semesterId, title, type, startDate, endDate");
        }

        boolean teachingAllowed = Boolean.TRUE.equals(body.get("teachingAllowed"))
                || "true".equalsIgnoreCase(String.valueOf(body.get("teachingAllowed")));
        String note = body.get("note") == null ? null : String.valueOf(body.get("note")).trim();

        String insertSql = """
                INSERT INTO academic_calendar_blocks
                    (semester_id, title, block_type, start_date, end_date, is_teaching_allowed, note)
                VALUES
                    (:semesterId, :title, :type, :startDate, :endDate, :teachingAllowed, :note)
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("semesterId", semesterId);
        params.put("title", String.valueOf(title).trim());
        params.put("type", normalize(String.valueOf(type)));
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("teachingAllowed", teachingAllowed);
        params.put("note", note);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(insertSql, new org.springframework.jdbc.core.namedparam.MapSqlParameterSource(params), keyHolder);

        long newId = keyHolder.getKey().longValue();
        String selectSql = """
                SELECT
                    cb.calendar_block_id AS id,
                    cb.semester_id AS semesterId,
                    s.semester_code AS semesterCode,
                    s.semester_name AS semesterName,
                    cb.title,
                    cb.block_type AS type,
                    cb.start_date AS startDate,
                    cb.end_date AS endDate,
                    cb.is_teaching_allowed AS teachingAllowed,
                    cb.note AS notes,
                    'ACTIVE' AS status,
                    cb.created_at AS createdAt,
                    cb.updated_at AS updatedAt
                FROM academic_calendar_blocks cb
                JOIN semesters s ON s.semester_id = cb.semester_id AND s.is_deleted = FALSE
                WHERE cb.calendar_block_id = :id
                """;
        Map<String, Object> created = jdbcTemplate.queryForMap(selectSql, Map.of("id", newId));
        return ApiResponse.success("Tạo thành công", created);
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> updateCalendarBlock(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        Object title = body.get("title");
        Object type = body.get("type");
        Object startDate = body.get("startDate");
        Object endDate = body.get("endDate");

        if (isBlank(title) || isBlank(type) || startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc: title, type, startDate, endDate");
        }

        boolean teachingAllowed = Boolean.TRUE.equals(body.get("teachingAllowed"))
                || "true".equalsIgnoreCase(String.valueOf(body.get("teachingAllowed")));
        String note = body.get("note") == null ? null : String.valueOf(body.get("note")).trim();

        String updateSql = """
                UPDATE academic_calendar_blocks
                SET title = :title,
                    block_type = :type,
                    start_date = :startDate,
                    end_date = :endDate,
                    is_teaching_allowed = :teachingAllowed,
                    note = :note
                WHERE calendar_block_id = :id
                """;

        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        params.put("title", String.valueOf(title).trim());
        params.put("type", normalize(String.valueOf(type)));
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("teachingAllowed", teachingAllowed);
        params.put("note", note);

        int rows = jdbcTemplate.update(updateSql, params);
        if (rows == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch học vụ với id=" + id);
        }

        String selectSql = """
                SELECT
                    cb.calendar_block_id AS id,
                    cb.semester_id AS semesterId,
                    s.semester_code AS semesterCode,
                    s.semester_name AS semesterName,
                    cb.title,
                    cb.block_type AS type,
                    cb.start_date AS startDate,
                    cb.end_date AS endDate,
                    cb.is_teaching_allowed AS teachingAllowed,
                    cb.note AS notes,
                    'ACTIVE' AS status,
                    cb.created_at AS createdAt,
                    cb.updated_at AS updatedAt
                FROM academic_calendar_blocks cb
                JOIN semesters s ON s.semester_id = cb.semester_id AND s.is_deleted = FALSE
                WHERE cb.calendar_block_id = :id
                """;
        Map<String, Object> updated = jdbcTemplate.queryForMap(selectSql, Map.of("id", id));
        return ApiResponse.success("Cập nhật thành công", updated);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCalendarBlock(@PathVariable Long id) {
        int rows = jdbcTemplate.update(
                "DELETE FROM academic_calendar_blocks WHERE calendar_block_id = :id",
                Map.of("id", id));
        if (rows == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch học vụ với id=" + id);
        }
        return ApiResponse.success("Đã xóa", null);
    }

    private boolean isBlank(Object value) {
        return value == null || String.valueOf(value).isBlank();
    }


    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
