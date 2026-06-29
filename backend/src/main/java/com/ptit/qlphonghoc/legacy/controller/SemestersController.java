package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.ptit.qlphonghoc.legacy.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping({"/semesters", "/api/semesters"})
public class SemestersController extends BaseCrudController {
    public SemestersController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "semesters", "semester_id",
                List.of("semester_id", "academic_year_id", "semester_code", "semester_year", "semester_type", "semester_name", "start_date", "end_date", "status", "created_at", "updated_at", "is_deleted"),
                true, "s.start_date DESC, s.semester_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "semester_id", List.of("id"),
                "semester_code", List.of("code"),
                "semester_name", List.of("name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT s.*,
                       s.semester_id AS id,
                       s.semester_code AS code,
                       s.semester_name AS name,
                       ay.year_label AS academic_year_label
                FROM semesters s
                JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String selectWhere() { return "s.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "s.semester_id"; }

    @Override
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse> update(
            @PathVariable Object id,
            @RequestBody Map<String, Object> body
    ) {
        ResponseEntity<ApiResponse> response = super.update(id, body);

        if (response.getStatusCode().is2xxSuccessful()) {
            Object status = readBody(body, "status");

            if (status != null && "ACTIVE".equalsIgnoreCase(String.valueOf(status))) {
                syncOtherSemestersWhenActive(id);
            }
        }

        return response;
    }

    private void syncOtherSemestersWhenActive(Object activeSemesterId) {
        jdbcTemplate.update(
                """
                UPDATE semesters other_sem
                JOIN semesters active_sem
                  ON active_sem.semester_id = ?
                SET other_sem.status = CASE
                    WHEN other_sem.start_date < active_sem.start_date THEN 'COMPLETED'
                    ELSE 'UPCOMING'
                END
                WHERE other_sem.academic_year_id = active_sem.academic_year_id
                  AND other_sem.semester_id <> active_sem.semester_id
                  AND other_sem.is_deleted = FALSE
                """,
                activeSemesterId
        );
    }
}
