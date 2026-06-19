package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/time-slots", "/api/time-slots"})
public class TimeSlotsController extends BaseCrudController {
    public TimeSlotsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "time_slots", "slot_id",
                List.of("slot_id", "slot_no", "slot_label", "start_time", "end_time", "created_at", "updated_at"),
                false, "slot_no ASC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "slot_id", List.of("id"),
                "slot_no", List.of("slot_number", "slotNumber"),
                "slot_label", List.of("label", "name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT slot_id,
                       slot_id AS id,
                       slot_no,
                       slot_no AS slot_number,
                       slot_label,
                       slot_label AS label,
                       start_time,
                       end_time,
                       created_at,
                       updated_at
                FROM time_slots
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }
}
