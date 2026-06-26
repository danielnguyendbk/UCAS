package com.ptit.qlphonghoc.facility.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityIssueReportCreateRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityIssueReportResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityMyAssignmentResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningActionRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningScheduleItemResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityRoomAccessHistoryItemResponse;
import com.ptit.qlphonghoc.facility.service.FacilityWorkflowService;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/facility")
public class FacilityAccessController {

    private final FacilityWorkflowService service;

    public FacilityAccessController(FacilityWorkflowService service) {
        this.service = service;
    }

    @GetMapping("/my-assignment")
    public ApiResponse<FacilityMyAssignmentResponse> getMyAssignment(
            @RequestParam(required = false) Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("OK", service.getMyAssignment(userDetails.getUserId(), semesterId));
    }

    @GetMapping("/opening-schedule")
    public ApiResponse<PageResponse<FacilityOpeningScheduleItemResponse>> getOpeningSchedule(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sourceType,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                "OK",
                service.getOpeningSchedule(
                        userDetails.getUserId(),
                        semesterId,
                        date,
                        search,
                        sourceType,
                        status,
                        page,
                        size
                )
        );
    }

    @PostMapping("/open-room")
    public ApiResponse<FacilityOpeningScheduleItemResponse> openRoom(
            @Valid @RequestBody FacilityOpeningActionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("OK", service.openRoom(userDetails.getUserId(), request));
    }

    @PostMapping("/close-room")
    public ApiResponse<FacilityOpeningScheduleItemResponse> closeRoom(
            @Valid @RequestBody FacilityOpeningActionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("OK", service.closeRoom(userDetails.getUserId(), request));
    }

    @GetMapping("/room-access-history")
    public ApiResponse<PageResponse<FacilityRoomAccessHistoryItemResponse>> getRoomAccessHistory(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                "OK",
                service.getRoomAccessHistory(
                        userDetails.getUserId(),
                        action,
                        startDate,
                        endDate,
                        search,
                        page,
                        size
                )
        );
    }

    @PostMapping("/issue-reports")
    public ResponseEntity<ApiResponse<FacilityIssueReportResponse>> createIssueReport(
            @Valid @RequestBody FacilityIssueReportCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        FacilityIssueReportResponse response = service.createIssueReport(userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("OK", response));
    }
}
