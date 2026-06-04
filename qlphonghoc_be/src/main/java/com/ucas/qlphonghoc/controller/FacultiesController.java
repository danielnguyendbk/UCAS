package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/faculties", "/api/faculties"})
public class FacultiesController extends BaseCrudController {
    public FacultiesController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "faculties", "id", List.of("id", "name", "code", "created_at", "updated_at", "is_deleted"), true, "id DESC");
    }
}
