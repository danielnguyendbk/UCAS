package com.ptit.qlphonghoc.admin.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/facility-staff")
public class AdminFacilityStaffController {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminFacilityStaffController(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getFacilityStaff(
            @RequestParam(required = false) Integer buildingId,
            @RequestParam(required = false) String status
    ) {
        String sql = """
            SELECT
                fs.facility_staff_id AS id,
                fs.user_id AS userId,
                u.username,
                u.email,
                u.status,
                fs.staff_code AS staffCode,
                fs.building_id AS buildingId,
                b.building_code AS buildingCode,
                b.building_name AS buildingName,
                fs.note,
                fs.created_at AS createdAt,
                fs.updated_at AS updatedAt
            FROM facility_staff fs
            JOIN users u ON u.user_id = fs.user_id
            LEFT JOIN buildings b ON b.building_id = fs.building_id AND b.is_deleted = FALSE
            WHERE fs.is_deleted = FALSE
              AND (:buildingId IS NULL OR fs.building_id = :buildingId)
              AND (:status IS NULL OR :status = '' OR u.status = :status)
            ORDER BY fs.staff_code ASC, fs.facility_staff_id ASC
            """;

        Map<String, Object> params = new HashMap<>();
        params.put("buildingId", buildingId);
        params.put("status", normalize(status));

        return ApiResponse.success("OK", jdbcTemplate.queryForList(sql, params));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
