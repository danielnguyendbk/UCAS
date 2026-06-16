package com.ptit.qlphonghoc.maintenance.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateMaintenanceStatusRequest(
        @NotBlank(message = "status is required")
        String status,
        String resolutionNote
) {
}
