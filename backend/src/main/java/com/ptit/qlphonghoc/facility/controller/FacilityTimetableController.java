package com.ptit.qlphonghoc.facility.controller;

import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.service.StaffClassSectionService;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableWorkflowSummary;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableWorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/facility/timetable")
public class FacilityTimetableController {

    private static final Set<String> VISIBLE_STATUSES = Set.of(
            TimetableWorkflowStatus.PUBLISHED.name(),
            TimetableWorkflowStatus.LOCKED.name()
    );

    private final TimetableWorkflowService workflowService;
    private final StaffClassSectionService classSectionService;

    public FacilityTimetableController(
            TimetableWorkflowService workflowService,
            StaffClassSectionService classSectionService
    ) {
        this.workflowService = workflowService;
        this.classSectionService = classSectionService;
    }

    @GetMapping
    public ResponseEntity<List<StaffSectionTableResponse>> getTimetable(
            @RequestParam Integer semesterId
    ) {
        TimetableWorkflowSummary workflow = workflowService.getStatus(semesterId);
        if (!VISIBLE_STATUSES.contains(workflow.timetableStatus())) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(classSectionService.getTable(semesterId));
    }
}
