package com.ucas.qlphonghoc.controller;

import com.ucas.qlphonghoc.common.ApiResponse;
import com.ucas.qlphonghoc.common.DbHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/exam-invigilators", "/api/exam-invigilators"})
public class ExamInvigilatorsController {
    private final JdbcTemplate jdbcTemplate;
    public ExamInvigilatorsController(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    @GetMapping
    public ResponseEntity<ApiResponse> getAll(@RequestParam Map<String,String> params) {
        try {
            List<String> where = new ArrayList<>();
            List<Object> args = new ArrayList<>();
            where.add("1 = 1");
            if (params.containsKey("exam_id")) { where.add("ei.exam_id = ?"); args.add(params.get("exam_id")); }
            if (params.containsKey("lecturer_id")) { where.add("ei.lecturer_id = ?"); args.add(params.get("lecturer_id")); }
            String sql = "SELECT ei.*, e.exam_date, l.full_name AS lecturer_name " +
                    "FROM exam_invigilators ei JOIN exams e ON ei.exam_id = e.id JOIN lecturers l ON ei.lecturer_id = l.id " +
                    "WHERE " + String.join(" AND ", where) + " ORDER BY ei.exam_id DESC, ei.lecturer_id ASC";
            return ResponseEntity.ok(ApiResponse.ok("Fetch exam_invigilators successfully", jdbcTemplate.queryForList(sql, args.toArray())));
        } catch (Exception e) { return serverError(e); }
    }

    @GetMapping("/{examId}/{lecturerId}")
    public ResponseEntity<ApiResponse> getOne(@PathVariable Object examId, @PathVariable Object lecturerId) {
        try {
            Map<String,Object> row = DbHelper.firstOrNull(jdbcTemplate,
                    "SELECT * FROM exam_invigilators WHERE exam_id = ? AND lecturer_id = ?", examId, lecturerId);
            if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("exam_invigilator not found"));
            return ResponseEntity.ok(ApiResponse.ok("Fetch exam_invigilator successfully", row));
        } catch (Exception e) { return serverError(e); }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody Map<String,Object> body) {
        try {
            Object examId = body.get("exam_id");
            Object lecturerId = body.get("lecturer_id");
            Object role = body.getOrDefault("role", "ASSISTANT");
            Object note = DbHelper.nullIfBlank(body.get("note"));
            if (DbHelper.missing(examId) || DbHelper.missing(lecturerId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("exam_id and lecturer_id are required"));
            }
            jdbcTemplate.update("INSERT INTO exam_invigilators (exam_id, lecturer_id, role, note) VALUES (?, ?, ?, ?)", examId, lecturerId, role, note);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Create exam_invigilator successfully", DbHelper.row("exam_id", examId, "lecturer_id", lecturerId)));
        } catch (Exception e) { return serverError(e); }
    }

    @PutMapping("/{examId}/{lecturerId}")
    public ResponseEntity<ApiResponse> update(@PathVariable Object examId, @PathVariable Object lecturerId, @RequestBody Map<String,Object> body) {
        try {
            if (!DbHelper.exists(jdbcTemplate, "SELECT 1 FROM exam_invigilators WHERE exam_id = ? AND lecturer_id = ?", examId, lecturerId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail("exam_invigilator not found"));
            }
            Object role = body.getOrDefault("role", "ASSISTANT");
            Object note = DbHelper.nullIfBlank(body.get("note"));
            jdbcTemplate.update("UPDATE exam_invigilators SET role = ?, note = ? WHERE exam_id = ? AND lecturer_id = ?", role, note, examId, lecturerId);
            return ResponseEntity.ok(ApiResponse.ok("Update exam_invigilator successfully"));
        } catch (Exception e) { return serverError(e); }
    }

    @DeleteMapping("/{examId}/{lecturerId}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Object examId, @PathVariable Object lecturerId) {
        try {
            jdbcTemplate.update("DELETE FROM exam_invigilators WHERE exam_id = ? AND lecturer_id = ?", examId, lecturerId);
            return ResponseEntity.ok(ApiResponse.ok("Delete exam_invigilator successfully"));
        } catch (Exception e) { return serverError(e); }
    }

    private ResponseEntity<ApiResponse> serverError(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.fail("Server error", e.getMessage()));
    }
}
