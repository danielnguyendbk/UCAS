package com.ptit.qlphonghoc.facility.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityAssignmentResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityAssignmentStatusRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityAssignmentUpsertRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityIssueReportCreateRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityIssueReportResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityMyAssignmentResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningActionRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningScheduleItemResponse;
import com.ptit.qlphonghoc.facility.service.FacilityWorkflowService;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/admin/facility-assignments", "/api/staff/facility-assignments"})
public class AdminFacilityAssignmentController {

    private final FacilityWorkflowService service;

    public AdminFacilityAssignmentController(FacilityWorkflowService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<PageResponse<FacilityAssignmentResponse>> list(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success("OK", service.listAssignments(semesterId, search, status, page, size));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FacilityAssignmentResponse>> create(
            @Valid @RequestBody FacilityAssignmentUpsertRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FacilityAssignmentResponse response = service.createAssignment(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("OK", response));
    }

    @PutMapping("/{assignmentId}")
    public ApiResponse<FacilityAssignmentResponse> update(
            @PathVariable Long assignmentId,
            @Valid @RequestBody FacilityAssignmentUpsertRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("OK", service.updateAssignment(assignmentId, request, userDetails.getUserId()));
    }

    @PatchMapping("/{assignmentId}/status")
    public ApiResponse<FacilityAssignmentResponse> updateStatus(
            @PathVariable Long assignmentId,
            @Valid @RequestBody FacilityAssignmentStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("OK", service.updateAssignmentStatus(assignmentId, request, userDetails.getUserId()));
    }
}
