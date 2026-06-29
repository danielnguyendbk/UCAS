package com.ptit.qlphonghoc.legacy.controller;

import com.ptit.qlphonghoc.legacy.common.ApiResponse;
import com.ptit.qlphonghoc.legacy.common.DbHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

public abstract class BaseCrudController {
    protected final JdbcTemplate jdbcTemplate;
    protected final String tableName;
    protected final String idColumn;
    protected final List<String> columns;
    protected final boolean softDelete;
    protected final String defaultOrderBy;

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

    protected Map<String, List<String>> fieldAliases() {
        return Map.of();
    }

    protected List<String> insertableColumns() {
        return columns.stream()
                .filter(c -> !c.equals(idColumn))
                .filter(c -> !c.equals("created_at"))
                .filter(c -> !c.equals("updated_at"))
                .filter(c -> !c.equals("id"))
                .filter(c -> !c.endsWith("_id_alias"))
                .collect(Collectors.toList());
    }

    protected List<String> updateableColumns() {
        return columns.stream()
                .filter(c -> !c.equals(idColumn))
                .filter(c -> !c.equals("created_at"))
                .filter(c -> !c.equals("updated_at"))
                .filter(c -> !c.equals("joined_at"))
                .filter(c -> !c.equals("enrolled_at"))
                .filter(c -> !c.equals("id"))
                .filter(c -> !c.endsWith("_id_alias"))
                .collect(Collectors.toList());
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAll(@RequestParam Map<String, String> params) {
        try {
            List<Object> args = new ArrayList<>();
            List<String> where = new ArrayList<>();
            where.add(selectWhere());
            Map<String, List<String>> aliases = fieldAliases();
            for (String col : columns) {
                String value = firstParamValue(params, col, aliases.getOrDefault(col, List.of()));
                if (value != null && !value.isBlank()) {
                    where.add(col + " = ?");
                    args.add(value);
                }
            }
            String sql = listSelectSql() + " WHERE " + String.join(" AND ", where) + " ORDER BY " + defaultOrderBy;
            return ResponseEntity.ok(ApiResponse.ok("Fetch " + tableName + " successfully", jdbcTemplate.queryForList(sql, args.toArray())));
        } catch (DataAccessException e) {

            throw e;

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
        } catch (DataAccessException e) {

            throw e;

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
        } catch (DataAccessException e) {

            throw e;

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
        } catch (DataAccessException e) {

            throw e;

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
        } catch (DataAccessException e) {

            throw e;

        } catch (Exception e) {

            return serverError(e);

        }
    }

    protected Object readBody(Map<String, Object> body, String snakeKey) {
        if (body == null) return null;
        if (body.containsKey(snakeKey)) return body.get(snakeKey);
        String camelKey = snakeToCamel(snakeKey);
        if (body.containsKey(camelKey)) return body.get(camelKey);
        for (String alias : fieldAliases().getOrDefault(snakeKey, List.of())) {
            if (body.containsKey(alias)) return body.get(alias);
            String aliasCamel = snakeToCamel(alias);
            if (body.containsKey(aliasCamel)) return body.get(aliasCamel);
        }
        return null;
    }

    protected boolean hasBodyKey(Map<String, Object> body, String snakeKey) {
        if (body == null) return false;
        if (body.containsKey(snakeKey) || body.containsKey(snakeToCamel(snakeKey))) return true;
        for (String alias : fieldAliases().getOrDefault(snakeKey, List.of())) {
            if (body.containsKey(alias) || body.containsKey(snakeToCamel(alias))) return true;
        }
        return false;
    }

    private String firstParamValue(Map<String, String> params, String key, List<String> aliases) {
        if (params.containsKey(key)) return params.get(key);
        String camel = snakeToCamel(key);
        if (params.containsKey(camel)) return params.get(camel);
        for (String alias : aliases) {
            if (params.containsKey(alias)) return params.get(alias);
            String aliasCamel = snakeToCamel(alias);
            if (params.containsKey(aliasCamel)) return params.get(aliasCamel);
        }
        return null;
    }

    protected String snakeToCamel(String snake) {
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
