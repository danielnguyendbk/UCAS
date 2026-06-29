package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/facility-staff", "/api/facility-staff"})
public class FacilityStaffController extends BaseCrudController {
    public FacilityStaffController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "facility_staff", "facility_staff_id",
                List.of("facility_staff_id", "user_id", "staff_code", "building_id", "note", "created_at", "updated_at", "is_deleted"),
                true, "fs.facility_staff_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of("facility_staff_id", List.of("id"));
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT fs.*,
                       fs.facility_staff_id AS id,
                       u.username,
                       u.email,
                       u.status AS user_status,
                       b.building_name,
                       b.building_code
                FROM facility_staff fs
                JOIN users u ON fs.user_id = u.user_id
                LEFT JOIN buildings b ON fs.building_id = b.building_id
                """;
    }

    @Override
    protected String oneSelectSql() { return listSelectSql(); }

    @Override
    protected String selectWhere() { return "fs.is_deleted = 0"; }

    @Override
    protected String idColumnForPath() { return "fs.facility_staff_id"; }
}
