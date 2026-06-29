package com.ptit.qlphonghoc.audit.controller;

import com.ptit.qlphonghoc.audit.dto.AuditLogDto;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.service.AuditLogService;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditController {

    private final AuditLogService auditLogService;

    public AdminAuditController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ApiResponse<PageResponse<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) String tableName,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        PageResponse<AuditLogDto> response = auditLogService.getAuditLogs(
                userId,
                action,
                tableName,
                search,
                startDate,
                endDate,
                page,
                size
        );
        return ApiResponse.success("Lấy danh sách nhật ký hệ thống thành công", response);
    }
}
