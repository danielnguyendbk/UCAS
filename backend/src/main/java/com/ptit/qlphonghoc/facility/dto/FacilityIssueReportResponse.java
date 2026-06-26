package com.ptit.qlphonghoc.facility.dto;

import java.time.LocalDateTime;

public record FacilityIssueReportResponse(
        Long id,
        Long classroomId,
        String issueTitle,
        String issueCategory,
        String severityLevel,
        String description,
        String status,
        Long reporterUserId,
        LocalDateTime createdAt
) {
}
