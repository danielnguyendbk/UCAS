package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/classroom-issue-reports", "/api/classroom-issue-reports"})
public class ClassroomIssueReportsController extends BaseCrudController {
    public ClassroomIssueReportsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "classroom_issue_reports", "id", List.of("id", "classroom_id", "reporter_user_id", "issue_title", "issue_category", "severity_level", "description", "image_url", "status", "handled_by", "handled_at", "resolution_note", "created_at", "updated_at", "is_deleted"), true, "i.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT i.*, c.room_number, c.room_name, u.full_name AS reporter_name FROM classroom_issue_reports i JOIN classrooms c ON i.classroom_id = c.id JOIN users u ON i.reporter_user_id = u.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT i.*, c.room_number, c.room_name, u.full_name AS reporter_name FROM classroom_issue_reports i JOIN classrooms c ON i.classroom_id = c.id JOIN users u ON i.reporter_user_id = u.id"; }

    @Override
    protected String selectWhere() { return "i.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "i.id"; }
}
