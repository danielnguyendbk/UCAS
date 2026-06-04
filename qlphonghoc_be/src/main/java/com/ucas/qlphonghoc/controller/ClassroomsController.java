package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/classrooms", "/api/classrooms"})
public class ClassroomsController extends BaseCrudController {
    public ClassroomsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "classrooms", "id", List.of("id", "building_id", "floor_number", "room_number", "room_name", "room_type", "capacity", "has_projector", "has_ac", "is_active", "created_at", "updated_at"), false, "c.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT c.*, b.name AS building_name, b.code AS building_code FROM classrooms c JOIN buildings b ON c.building_id = b.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT c.*, b.name AS building_name, b.code AS building_code FROM classrooms c JOIN buildings b ON c.building_id = b.id"; }

    @Override
    protected String selectWhere() { return "1 = 1"; }

    @Override
    protected String idColumnForPath() { return "c.id"; }
}
