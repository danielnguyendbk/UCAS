package com.ucas.qlphonghoc.common;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DbHelper {
    private DbHelper() {}

    public static boolean exists(JdbcTemplate jdbcTemplate, String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return !rows.isEmpty();
    }

    public static Map<String, Object> firstOrNull(JdbcTemplate jdbcTemplate, String sql, Object... args) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, args);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public static Number insert(JdbcTemplate jdbcTemplate, String sql, Object... args) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) {
                ps.setObject(i + 1, args[i]);
            }
            return ps;
        }, keyHolder);
        return keyHolder.getKey();
    }

    public static Object value(Map<String, Object> body, String key) {
        return body == null ? null : body.get(key);
    }

    public static Object defaultValue(Object value, Object fallback) {
        return value == null ? fallback : value;
    }

    public static Object nullIfBlank(Object value) {
        if (value == null) return null;
        if (value instanceof String s && s.trim().isEmpty()) return null;
        return value;
    }

    public static boolean missing(Object value) {
        if (value == null) return true;
        if (value instanceof String s) return s.trim().isEmpty();
        return false;
    }

    public static boolean invalidEnum(Object value, String... allowed) {
        if (value == null) return false;
        String text = value.toString();
        for (String item : allowed) {
            if (item.equals(text)) return false;
        }
        return true;
    }

    public static Map<String, Object> row(Object... keyValues) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < keyValues.length - 1; i += 2) {
            map.put(String.valueOf(keyValues[i]), keyValues[i + 1]);
        }
        return map;
    }
}
