package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/audit-logs", "/api/audit-logs"})
public class AuditLogsController extends BaseCrudController {
    public AuditLogsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "audit_logs", "id", List.of("id", "user_id", "action", "table_name", "record_id", "old_values", "new_values", "description", "ip_address", "created_at"), false, "id DESC");
    }
}
