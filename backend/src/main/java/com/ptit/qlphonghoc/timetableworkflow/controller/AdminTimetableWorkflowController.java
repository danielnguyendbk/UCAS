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

    @PostMapping("/validate")
    public ApiResponse<TimetableWorkflowSummary> validate(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                "Timetable validation completed.",
                service.validate(semesterId, userDetails.getUserId())
        );
    }

    @PostMapping("/publish")
    public ResponseEntity<ApiResponse<TimetableWorkflowSummary>> publish(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        TimetableWorkflowSummary summary = service.publish(semesterId, userDetails.getUserId());
        if (TimetableWorkflowStatus.CONFLICT.name().equals(summary.timetableStatus())) {
            throw new BadRequestException(
                    "ALLOCATION_CONFLICT",
                    "Thời khóa biểu còn xung đột và chưa thể công bố.",
                    summary
            );
        }
        return ResponseEntity.ok(ApiResponse.success("Timetable published.", summary));
    }

    @PostMapping("/lock")
    public ApiResponse<TimetableWorkflowSummary> lock(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                "Timetable locked.",
                service.lock(semesterId, userDetails.getUserId())
        );
    }

    @PostMapping("/reopen")
    public ApiResponse<TimetableWorkflowSummary> reopen(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new BadRequestException(
                    "UNAUTHENTICATED",
                    "Không xác định được người dùng hiện tại."
            );
        }

        TimetableWorkflowSummary summary = service.reopen(
                semesterId,
                userDetails.getUserId()
        );

        return ApiResponse.success("Đã mở lại thời khóa biểu để chỉnh sửa.", summary);
    }

}
