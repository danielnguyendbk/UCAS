package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping({"/users", "/api/users"})
public class UsersController extends BaseCrudController {
    public UsersController(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate, "users", "id", List.of("id", "username", "email", "password_hash", "full_name", "role", "is_active", "last_login_at", "created_at", "updated_at", "is_deleted"), true, "id DESC");
    }
}
