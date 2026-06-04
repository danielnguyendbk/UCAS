package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/clubs", "/api/clubs"})
public class ClubsController extends BaseCrudController {
    public ClubsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "clubs", "id", List.of("id", "club_code", "club_name", "faculty_id", "advisor_user_id", "status", "created_at", "updated_at", "is_deleted"), true, "id DESC");
    }
}
