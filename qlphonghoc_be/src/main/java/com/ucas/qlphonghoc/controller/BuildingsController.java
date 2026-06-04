package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/buildings", "/api/buildings"})
public class BuildingsController extends BaseCrudController {
    public BuildingsController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "buildings", "id", List.of("id", "name", "code", "created_at", "updated_at"), false, "id DESC");
    }
}
