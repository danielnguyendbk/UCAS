package com.ptit.qlphonghoc.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMaintenanceRequest(
        @NotBlank(message = "roomCode is required")
        String roomCode,

        @NotBlank(message = "issueCategory is required")
        String issueCategory,

        @NotBlank(message = "severityLevel is required")
        String severityLevel,

        @Size(max = 200, message = "issueTitle must be at most 200 characters")
        String issueTitle,

        @NotBlank(message = "description is required")
        String description,

        @Size(max = 255, message = "imageUrl must be at most 255 characters")
        String imageUrl
) {
}
