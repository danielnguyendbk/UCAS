package com.ptit.qlphonghoc.admin.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
