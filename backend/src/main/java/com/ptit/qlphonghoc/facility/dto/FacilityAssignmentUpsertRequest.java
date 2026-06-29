package com.ptit.qlphonghoc.facility.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record FacilityAssignmentUpsertRequest(
        @NotNull @Positive Long semesterId,
        @NotNull @Positive Long facilityStaffId,
        @NotNull @Positive Long buildingId,
        @Size(max = 255) String note,
        FacilityAssignmentStatus status
) {
}
