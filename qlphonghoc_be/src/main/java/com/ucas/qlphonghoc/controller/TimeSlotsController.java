package com.ucas.qlphonghoc.controller;

import com.ucas.qlphonghoc.common.ApiResponse;
import com.ucas.qlphonghoc.common.DbHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/time-slots", "/api/time-slots"})
public class TimeSlotsController extends BaseCrudController {
    public TimeSlotsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "time_slots", "slot_id", List.of("slot_id", "slot_no", "slot_label", "start_time", "end_time", "created_at", "updated_at"), false, "slot_no ASC");
    }

    @Override
    protected String listSelectSql() {
        return "SELECT slot_id, slot_id AS id, slot_no, slot_no AS slot_number, slot_label, start_time, end_time, created_at, updated_at FROM time_slots";
    }

    @Override
    protected String oneSelectSql() {
        return listSelectSql();
    }

    @Override
    protected String idColumnForPath() { return "slot_id"; }

    @Override
    protected Object readBody(Map<String, Object> body, String snakeKey) {
        if (body == null) return null;
        if (body.containsKey(snakeKey)) return body.get(snakeKey);
        if (snakeKey.equals("slot_no") && body.containsKey("slot_number")) return body.get("slot_number");
        if (snakeKey.equals("slot_label") && body.containsKey("label")) return body.get("label");
        return super.readBody(body, snakeKey);
    }

    @Override
    protected boolean hasBodyKey(Map<String, Object> body, String snakeKey) {
        if (body == null) return false;
        if (super.hasBodyKey(body, snakeKey)) return true;
        return (snakeKey.equals("slot_no") && body.containsKey("slot_number")) ||
               (snakeKey.equals("slot_label") && body.containsKey("label"));
    }
}
