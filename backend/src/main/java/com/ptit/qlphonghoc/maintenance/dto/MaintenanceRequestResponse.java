package com.ptit.qlphonghoc.maintenance.dto;

import java.time.LocalDateTime;

public record MaintenanceRequestResponse(
        Integer id,
        String requestCode,
        String issueTitle,
        String issueCategory,
        String severityLevel,
        String description,
        String imageUrl,
        String status,
        String roomCode,
        String roomName,
        String buildingName,
        String reporterName,
        String handledByName,
        String resolutionNote,
        LocalDateTime createdAt,
        LocalDateTime handledAt
) {
}
