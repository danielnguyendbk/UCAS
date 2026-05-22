package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.service.StaffClassSectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff/class-sections")
@CrossOrigin(origins = "*")
public class StaffClassSectionController {

    private final StaffClassSectionService staffClassSectionService;

    public StaffClassSectionController(StaffClassSectionService staffClassSectionService) {
        this.staffClassSectionService = staffClassSectionService;
    }

    @GetMapping
    public ResponseEntity<List<StaffSectionTableResponse>> getTable(
            @RequestParam(required = false) Integer semesterId
    ) {
        return ResponseEntity.ok(staffClassSectionService.getTable(semesterId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffSectionTableResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(staffClassSectionService.getById(id));
    }
}
