package com.ptit.qlphonghoc.facility.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record FacilityOpeningActionRequest(
        @NotNull @Positive Integer semesterId,
        @NotNull String sourceType,
        @NotNull @Positive Long sourceId,
        @NotNull @Positive Long classroomId
) {
}
