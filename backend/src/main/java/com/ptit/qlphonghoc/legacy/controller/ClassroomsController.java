package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/classrooms", "/api/classrooms"})
public class ClassroomsController extends BaseCrudController {
    public ClassroomsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "classrooms", "classroom_id",
                List.of("classroom_id", "building_id", "floor_number", "room_number", "classroom_code", "classroom_name", "room_type", "capacity", "has_projector", "has_ac", "is_active", "created_at", "updated_at", "is_deleted"),
                true, "c.classroom_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "classroom_id", List.of("id"),
                "classroom_code", List.of("code", "room_code"),
                "classroom_name", List.of("name", "room_name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT c.*,
                       c.classroom_id AS id,
                       c.classroom_code AS code,
                       c.classroom_code AS room_code,
                       c.classroom_name AS name,
                       c.classroom_name AS room_name,
                       b.building_name,
                       b.building_code,
                       CONCAT(b.building_code, '-', c.room_number) AS display_room_code
                FROM classrooms c
                JOIN buildings b ON c.building_id = b.building_id
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String selectWhere() { return "c.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "c.classroom_id"; }
}
