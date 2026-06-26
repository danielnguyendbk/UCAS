package com.ptit.qlphonghoc.facility.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record FacilityAssignmentUpsertRequest(
        @NotNull @Positive Integer semesterId,
        @NotNull @Positive Integer facilityStaffId,
        @NotNull @Positive Integer buildingId,
        @Size(max = 255) String note,
        FacilityAssignmentStatus status
) {
}
