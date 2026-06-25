package com.ptit.qlphonghoc.admin.controller;

import com.ptit.qlphonghoc.admin.dto.AdminScheduleUpdateRequest;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionRequest;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionResponse;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSuggestionRequest;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSuggestionResponse;
import com.ptit.qlphonghoc.admin.service.AdminSectionSplitService;
import com.ptit.qlphonghoc.admin.service.AdminScheduleEditService;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.staff.dto.class_section.CreateSectionRequest;
import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.dto.class_section.UpdateSectionRequest;
import com.ptit.qlphonghoc.staff.service.StaffClassSectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/admin/class-sections")
@CrossOrigin(origins = "*")
public class AdminClassSectionController {

    private final StaffClassSectionService classSectionService;
    private final AdminScheduleEditService scheduleEditService;
    private final AdminSectionSplitService sectionSplitService;

    public AdminClassSectionController(
            StaffClassSectionService classSectionService,
            AdminScheduleEditService scheduleEditService,
            AdminSectionSplitService sectionSplitService
    ) {
        this.classSectionService = classSectionService;
        this.scheduleEditService = scheduleEditService;
        this.sectionSplitService = sectionSplitService;
    }

    @GetMapping
    public ResponseEntity<List<StaffSectionTableResponse>> getTable(
            @RequestParam(required = false) Integer semesterId
    ) {
        return ResponseEntity.ok(classSectionService.getTable(semesterId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StaffSectionTableResponse> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(classSectionService.getById(id));
    }

    @PostMapping
    public ResponseEntity<StaffSectionTableResponse> create(
            @Valid @RequestBody CreateSectionRequest request
    ) {
        StaffSectionTableResponse response = classSectionService.create(request);

        return ResponseEntity
                .created(URI.create("/api/admin/class-sections/" + response.getId()))
                .body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffSectionTableResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateSectionRequest request
    ) {
        return ResponseEntity.ok(classSectionService.update(id, request));
    }

    @PutMapping("/{sectionId}/schedules/{scheduleId}")
    public ResponseEntity<StaffSectionTableResponse> updateSchedule(
            @PathVariable Integer sectionId,
            @PathVariable Integer scheduleId,
            @Valid @RequestBody AdminScheduleUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                scheduleEditService.update(sectionId, scheduleId, request, userDetails.getUserId())
        );
    }

    @PostMapping("/{sectionId}/split")
    public ResponseEntity<AdminSplitSectionResponse> splitSection(
            @PathVariable Integer sectionId,
            @Valid @RequestBody AdminSplitSectionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(
                sectionSplitService.split(sectionId, request, userDetails.getUserId())
        );
    }

    @PostMapping("/{sectionId}/split/suggestions")
    public ResponseEntity<AdminSplitSuggestionResponse> suggestSplitSection(
            @PathVariable Integer sectionId,
            @Valid @RequestBody AdminSplitSuggestionRequest request
    ) {
        return ResponseEntity.ok(sectionSplitService.suggest(sectionId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        classSectionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
