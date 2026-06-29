package com.ptit.qlphonghoc.facility.dto;

import java.time.LocalDateTime;

public record FacilityAssignmentResponse(
        Long id,
        Long semesterId,
        String semesterCode,
        String semesterName,
        Long facilityStaffId,
        String staffCode,
        String username,
        String fullName,
        Long buildingId,
        String buildingCode,
        String buildingName,
        FacilityAssignmentStatus status,
        String note,
        Long assignedBy,
        String assignedByUsername,
        LocalDateTime assignedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
