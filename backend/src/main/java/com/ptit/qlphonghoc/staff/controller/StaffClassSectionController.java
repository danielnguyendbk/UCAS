package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.staff.dto.class_section.CreateSectionRequest;
import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.dto.class_section.UpdateSectionRequest;
import com.ptit.qlphonghoc.staff.service.StaffClassSectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
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

    @PostMapping
    public ResponseEntity<StaffSectionTableResponse> create(
            @Valid @RequestBody CreateSectionRequest request
    ) {
        StaffSectionTableResponse response = staffClassSectionService.create(request);

        return ResponseEntity
                .created(URI.create("/api/staff/class-sections/" + response.getId()))
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffSectionTableResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSectionRequest request
    ) {
        return ResponseEntity.ok(staffClassSectionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        staffClassSectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}