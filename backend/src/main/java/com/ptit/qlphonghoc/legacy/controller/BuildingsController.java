package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/buildings", "/api/buildings"})
public class BuildingsController extends BaseCrudController {
    public BuildingsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "buildings", "building_id",
                List.of("building_id", "building_code", "building_name", "created_at", "updated_at", "is_deleted"),
                true, "building_id DESC");
    }

    @Override
    protected Map<String, List<String>> fieldAliases() {
        return Map.of(
                "building_id", List.of("id"),
                "building_code", List.of("code"),
                "building_name", List.of("name")
        );
    }

    @Override
    protected String listSelectSql() {
        return """
                SELECT building_id,
                       building_id AS id,
                       building_code,
                       building_code AS code,
                       building_name,
                       building_name AS name,
                       created_at,
                       updated_at,
                       is_deleted
                FROM buildings
                """;
    }

    @Override
    protected String oneSelectSql() {
        return listSelectSql();
    }
}
