package com.ptit.qlphonghoc.facility.dto;

import java.time.LocalDateTime;

public record FacilityMyAssignmentResponse(
        Long assignmentId,
        Long semesterId,
        String semesterCode,
        String semesterName,
        Long buildingId,
        String buildingCode,
        String buildingName,
        Long facilityStaffId,
        String staffCode,
        FacilityAssignmentStatus status,
        String note,
        LocalDateTime assignedAt
) {
}
