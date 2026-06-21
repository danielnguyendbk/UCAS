package com.ptit.qlphonghoc.timetableworkflow.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableWorkflowSummary;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableWorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/timetable-workflow")
public class AdminTimetableWorkflowController {

    private final TimetableWorkflowService service;

    public AdminTimetableWorkflowController(TimetableWorkflowService service) {
        this.service = service;
    }

    @GetMapping("/pending")
    public ApiResponse<TimetableWorkflowSummary> getPending(@RequestParam Integer semesterId) {
        return ApiResponse.success("OK", service.getStatus(semesterId));
    }

    @PostMapping("/approve")
    public ApiResponse<TimetableWorkflowSummary> approve(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                "Timetable approved.",
                service.approve(semesterId, userDetails.getUserId())
        );
    }

    @PostMapping("/publish")
    public ResponseEntity<ApiResponse<TimetableWorkflowSummary>> publish(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        TimetableWorkflowSummary summary = service.publish(semesterId, userDetails.getUserId());
        if (TimetableWorkflowStatus.CONFLICT.name().equals(summary.timetableStatus())) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                    "Timetable has blocking conflicts and cannot be published.",
                    summary
            ));
        }
        return ResponseEntity.ok(ApiResponse.success("Timetable published.", summary));
    }
}
