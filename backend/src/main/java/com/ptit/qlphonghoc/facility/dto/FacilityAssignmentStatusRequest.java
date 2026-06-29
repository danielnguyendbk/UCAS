package com.ptit.qlphonghoc.facility.dto;

import jakarta.validation.constraints.NotNull;

public record FacilityAssignmentStatusRequest(
        @NotNull FacilityAssignmentStatus status
) {
}
