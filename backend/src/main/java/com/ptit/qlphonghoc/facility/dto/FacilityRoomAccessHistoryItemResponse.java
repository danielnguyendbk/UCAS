package com.ptit.qlphonghoc.facility.dto;

import java.time.LocalDateTime;

public record FacilityRoomAccessHistoryItemResponse(
        Long id,
        String action,
        String classroomCode,
        String sourceType,
        Long sourceId,
        String description,
        LocalDateTime createdAt
) {}
