package com.ptit.qlphonghoc.facility.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record FacilityIssueReportCreateRequest(
        @NotNull @Positive Long classroomId,
        @NotBlank @Size(max = 200) String issueTitle,
        @NotBlank @Size(max = 40) String issueCategory,
        @NotBlank @Size(max = 40) String severityLevel,
        @NotBlank String description,
        Long semesterId
) {
}
