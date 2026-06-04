package com.ucas.qlphonghoc.controller;

import com.ucas.qlphonghoc.common.ApiResponse;
import com.ucas.qlphonghoc.common.DbHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

public abstract class BaseCrudController {
    protected final JdbcTemplate jdbcTemplate;
    private final String tableName;
    private final String idColumn;
    private final List<String> columns;
    private final boolean softDelete;
    private final String defaultOrderBy;

    protected BaseCrudController(JdbcTemplate jdbcTemplate, String tableName, String idColumn,
                                 List<String> columns, boolean softDelete, String defaultOrderBy) {
        this.jdbcTemplate = jdbcTemplate;
        this.tableName = tableName;
        this.idColumn = idColumn;
        this.columns = columns;
        this.softDelete = softDelete;
        this.defaultOrderBy = defaultOrderBy;
    }

    protected String listSelectSql() {
        return "SELECT * FROM " + tableName;
    }

    protected String oneSelectSql() {
        return "SELECT * FROM " + tableName;
    }

    protected String baseWhere() {
        return softDelete ? "is_deleted = 0" : "1 = 1";
    }

    protected String selectWhere() {
        return baseWhere();
    }

    protected String idColumnForPath() {
        return idColumn;
    }

    protected List<String> insertableColumns() {
        return columns.stream()
                .filter(c -> !c.equals(idColumn))
                .filter(c -> !c.equals("created_at"))
                .filter(c -> !c.equals("updated_at"))
                .collect(Collectors.toList());
    }

    protected List<String> updateableColumns() {
        return columns.stream()
                .filter(c -> !c.equals(idColumn))
                .filter(c -> !c.equals("created_at"))
                .filter(c -> !c.equals("updated_at"))
                .filter(c -> !c.equals("joined_at"))
                .filter(c -> !c.equals("enrolled_at"))
                .collect(Collectors.toList());
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAll(@RequestParam Map<String, String> params) {
        try {
            List<Object> args = new ArrayList<>();
            List<String> where = new ArrayList<>();
            where.add(selectWhere());
            for (String col : columns) {
                if (params.containsKey(col) && !params.get(col).isBlank()) {
                    where.add(col + " = ?");
                    args.add(params.get(col));
                }
            }
            String sql = listSelectSql() + " WHERE " + String.join(" AND ", where) + " ORDER BY " + defaultOrderBy;
            return ResponseEntity.ok(ApiResponse.ok("Fetch " + tableName + " successfully", jdbcTemplate.queryForList(sql, args.toArray())));
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getById(@PathVariable Object id) {
        try {
            String sql = oneSelectSql() + " WHERE " + selectWhere() + " AND " + idColumnForPath() + " = ?";
            Map<String, Object> row = DbHelper.firstOrNull(jdbcTemplate, sql, id);
            if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail(tableName + " not found"));
            return ResponseEntity.ok(ApiResponse.ok("Fetch " + tableName + " successfully", row));
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody Map<String, Object> body) {
        try {
            List<String> cols = new ArrayList<>();
            List<Object> vals = new ArrayList<>();
            for (String col : insertableColumns()) {
                Object val = readBody(body, col);
                if (val != null) {
                    cols.add(col);
                    vals.add(DbHelper.nullIfBlank(val));
                }
            }
            if (cols.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("Request body has no valid fields for " + tableName));
            }
            String placeholders = cols.stream().map(c -> "?").collect(Collectors.joining(", "));
            String sql = "INSERT INTO " + tableName + " (" + String.join(", ", cols) + ") VALUES (" + placeholders + ")";
            Number newId = DbHelper.insert(jdbcTemplate, sql, vals.toArray());
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Create " + tableName + " successfully", DbHelper.row(idColumn, newId)));
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> update(@PathVariable Object id, @RequestBody Map<String, Object> body) {
        try {
            if (!DbHelper.exists(jdbcTemplate, "SELECT 1 FROM " + tableName + " WHERE " + baseWhere() + " AND " + idColumn + " = ?", id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail(tableName + " not found"));
            }
            List<String> sets = new ArrayList<>();
            List<Object> vals = new ArrayList<>();
            for (String col : updateableColumns()) {
                if (hasBodyKey(body, col)) {
                    sets.add(col + " = ?");
                    vals.add(DbHelper.nullIfBlank(readBody(body, col)));
                }
            }
            if (sets.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("Request body has no valid fields to update for " + tableName));
            }
            vals.add(id);
            String sql = "UPDATE " + tableName + " SET " + String.join(", ", sets) + " WHERE " + idColumn + " = ?";
            jdbcTemplate.update(sql, vals.toArray());
            return ResponseEntity.ok(ApiResponse.ok("Update " + tableName + " successfully"));
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Object id) {
        try {
            if (!DbHelper.exists(jdbcTemplate, "SELECT 1 FROM " + tableName + " WHERE " + baseWhere() + " AND " + idColumn + " = ?", id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail(tableName + " not found"));
            }
            if (softDelete) jdbcTemplate.update("UPDATE " + tableName + " SET is_deleted = 1 WHERE " + idColumn + " = ?", id);
            else jdbcTemplate.update("DELETE FROM " + tableName + " WHERE " + idColumn + " = ?", id);
            return ResponseEntity.ok(ApiResponse.ok("Delete " + tableName + " successfully"));
        } catch (Exception e) {
            return serverError(e);
        }
    }

    protected Object readBody(Map<String, Object> body, String snakeKey) {
        if (body == null) return null;
        if (body.containsKey(snakeKey)) return body.get(snakeKey);
        String camelKey = snakeToCamel(snakeKey);
        if (body.containsKey(camelKey)) return body.get(camelKey);
        // Compatibility for old Node time slot field names is handled in TimeSlotController.
        return null;
    }

    protected boolean hasBodyKey(Map<String, Object> body, String snakeKey) {
        if (body == null) return false;
        return body.containsKey(snakeKey) || body.containsKey(snakeToCamel(snakeKey));
    }

    private String snakeToCamel(String snake) {
        StringBuilder sb = new StringBuilder();
        boolean upper = false;
        for (char ch : snake.toCharArray()) {
            if (ch == '_') { upper = true; continue; }
            sb.append(upper ? Character.toUpperCase(ch) : ch);
            upper = false;
        }
        return sb.toString();
    }

    protected ResponseEntity<ApiResponse> serverError(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.fail("Server error", e.getMessage()));
    }
}
