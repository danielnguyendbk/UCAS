package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/club-memberships", "/api/club-memberships"})
public class ClubMembershipsController extends BaseCrudController {
    public ClubMembershipsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "club_memberships", "id", List.of("id", "club_id", "student_id", "position_name", "is_representative", "is_active", "joined_at"), false, "id DESC");
    }
}
