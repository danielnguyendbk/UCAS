package com.ptit.qlphonghoc.timetableworkflow.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
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
@RequestMapping("/api/staff/timetable-workflow")
public class StaffTimetableWorkflowController {

    private final TimetableWorkflowService service;

    public StaffTimetableWorkflowController(TimetableWorkflowService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public ApiResponse<TimetableWorkflowSummary> getStatus(@RequestParam Integer semesterId) {
        return ApiResponse.success("OK", service.getStatus(semesterId));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<TimetableWorkflowSummary>> submit(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        TimetableWorkflowSummary summary = service.submit(semesterId, userDetails.getUserId());
        if (TimetableWorkflowStatus.CONFLICT.name().equals(summary.timetableStatus())) {
            throw new BadRequestException(
                    "ALLOCATION_CONFLICT",
                    "Thời khóa biểu vẫn còn xung đột và chưa thể gửi duyệt.",
                    summary
            );
        }
        return ResponseEntity.ok(ApiResponse.success("Timetable submitted for approval.", summary));
    }
}
