package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/schedules", "/api/schedules"})
public class SchedulesController extends BaseCrudController {
    public SchedulesController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "schedules", "schedule_id",
                List.of("schedule_id", "section_id", "classroom_id", "day_of_week", "slot_start_id", "slot_end_id", "start_time", "end_time", "from_week_no", "to_week_no", "session_type", "practice_group_no", "assigned_by", "assigned_at", "status", "note", "created_at", "updated_at"),
                false, "sc.schedule_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of("schedule_id", List.of("id"));
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT sc.*,
                       sc.schedule_id AS id,
                       cs.section_code,
                       cs.class_name,
                       co.course_code,
                       co.course_name,
                       cr.room_number,
                       cr.classroom_code,
                       cr.classroom_name,
                       cr.classroom_name AS room_name,
                       b.building_name,
                       b.building_code,
                       CONCAT(COALESCE(b.building_code, 'Tòa'), '-', cr.room_number) AS room_code,
                       ts1.slot_label AS slot_start_label,
                       ts2.slot_label AS slot_end_label
                FROM schedules sc
                JOIN class_sections cs ON sc.section_id = cs.section_id
                JOIN courses co ON cs.course_id = co.course_id
                LEFT JOIN classrooms cr ON sc.classroom_id = cr.classroom_id
                LEFT JOIN buildings b ON cr.building_id = b.building_id
                LEFT JOIN time_slots ts1 ON sc.slot_start_id = ts1.slot_id
                LEFT JOIN time_slots ts2 ON sc.slot_end_id = ts2.slot_id
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String selectWhere() { return "1 = 1"; }

    @Override
    protected String idColumnForPath() { return "sc.schedule_id"; }
}
