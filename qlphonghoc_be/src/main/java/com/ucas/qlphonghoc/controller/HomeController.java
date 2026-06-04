package com.ucas.qlphonghoc.controller;

import com.ucas.qlphonghoc.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {
    @GetMapping({"/", "/api"})
    public ResponseEntity<ApiResponse> home() {
        return ResponseEntity.ok(ApiResponse.ok("API qlphonghoc Spring Boot is running", Map.of("database", "QLPHONGHOC1")));
    }
}
