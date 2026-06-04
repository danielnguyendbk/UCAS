package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/temporary-room-changes", "/api/temporary-room-changes"})
public class TemporaryRoomChangesController extends BaseCrudController {
    public TemporaryRoomChangesController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "temporary_room_changes", "id", List.of("id", "schedule_id", "semester_id", "change_scope", "target_date", "from_week", "to_week", "old_classroom_id", "requested_classroom_id", "new_classroom_id", "reason", "requested_by", "created_by", "status", "reviewed_by", "reviewed_at", "review_note", "reject_reason", "is_active", "created_at", "updated_at", "status", "OR", "status", "OR"), false, "id DESC");
    }
}
