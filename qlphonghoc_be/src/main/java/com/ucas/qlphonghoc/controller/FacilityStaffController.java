package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/facility-staff", "/api/facility-staff"})
public class FacilityStaffController extends BaseCrudController {
    public FacilityStaffController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "facility_staff", "id", List.of("id", "user_id", "staff_code", "building_id", "note", "created_at", "updated_at", "is_deleted"), true, "fs.id DESC");
    }

    @Override
    protected String listSelectSql() { return "SELECT fs.*, u.username, u.full_name, b.name AS building_name FROM facility_staff fs JOIN users u ON fs.user_id = u.id LEFT JOIN buildings b ON fs.building_id = b.id"; }

    @Override
    protected String oneSelectSql() { return "SELECT fs.*, u.username, u.full_name, b.name AS building_name FROM facility_staff fs JOIN users u ON fs.user_id = u.id LEFT JOIN buildings b ON fs.building_id = b.id"; }

    @Override
    protected String selectWhere() { return "fs.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "fs.id"; }
}
