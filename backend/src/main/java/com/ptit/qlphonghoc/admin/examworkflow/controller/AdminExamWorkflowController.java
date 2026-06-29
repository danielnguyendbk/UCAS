package com.ptit.qlphonghoc.admin.examworkflow.controller;

import com.ptit.qlphonghoc.admin.examworkflow.dto.ExamWorkflowStatusSummary;
import com.ptit.qlphonghoc.admin.examworkflow.service.ExamWorkflowService;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/exam-workflow")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamWorkflowController {

    private final ExamWorkflowService service;

    public AdminExamWorkflowController(ExamWorkflowService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public ApiResponse<ExamWorkflowStatusSummary> getStatus(@RequestParam Long semesterId) {
        return ApiResponse.success("OK", service.getStatus(semesterId));
    }

    @PostMapping("/validate")
    public ApiResponse<ExamWorkflowStatusSummary> validate(
            @RequestParam Long semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("Đã kiểm tra lịch thi.", service.validate(semesterId, userDetails.getUserId()));
    }

    @PostMapping("/publish")
    public ApiResponse<ExamWorkflowStatusSummary> publish(
            @RequestParam Long semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("Đã công bố lịch thi.", service.publish(semesterId, userDetails.getUserId()));
    }

    @PostMapping("/lock")
    public ApiResponse<ExamWorkflowStatusSummary> lock(
            @RequestParam Long semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("Đã khoá lịch thi.", service.lock(semesterId, userDetails.getUserId()));
    }

    @PostMapping("/reopen")
    public ApiResponse<ExamWorkflowStatusSummary> reopen(
            @RequestParam Long semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("Đã mở lại lịch thi.", service.reopen(semesterId, userDetails.getUserId()));
    }

    @PostMapping("/approve")
    public ApiResponse<ExamWorkflowStatusSummary> approve(
            @RequestParam Long semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success("Đã duyệt hợp lệ lịch thi.", service.approve(semesterId, userDetails.getUserId()));
    }

}
