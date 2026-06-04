package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/schedules", "/api/schedules"})
public class SchedulesController extends BaseCrudController {
    public SchedulesController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "schedules", "id", List.of("id", "section_id", "classroom_id", "day_of_week", "slot_start_id", "slot_end_id", "start_time", "end_time", "from_week_no", "to_week_no", "session_type", "practice_group_no", "assigned_by", "assigned_at", "status", "note", "created_at", "updated_at", "to_week_no"), false, "sc.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT sc.*, cs.section_code, co.course_code, co.course_name, cr.room_number, cr.room_name, b.name AS building_name FROM schedules sc JOIN class_sections cs ON sc.section_id = cs.id JOIN courses co ON cs.course_id = co.id JOIN classrooms cr ON sc.classroom_id = cr.id JOIN buildings b ON cr.building_id = b.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT sc.*, cs.section_code, co.course_code, co.course_name, cr.room_number, cr.room_name, b.name AS building_name FROM schedules sc JOIN class_sections cs ON sc.section_id = cs.id JOIN courses co ON cs.course_id = co.id JOIN classrooms cr ON sc.classroom_id = cr.id JOIN buildings b ON cr.building_id = b.id"; }

    @Override
    protected String selectWhere() { return "1 = 1"; }

    @Override
    protected String idColumnForPath() { return "sc.id"; }
}
