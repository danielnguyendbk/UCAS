package com.ptit.qlphonghoc.facility.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record FacilityOpeningScheduleItemResponse(
        FacilityOpeningSourceType sourceType,
        Long sourceId,
        Long semesterId,
        Long buildingId,
        String buildingCode,
        Long classroomId,
        String classroomCode,
        String title,
        String subtitle,
        LocalDate accessDate,
        LocalTime startTime,
        LocalTime endTime,
        LocalTime expectedOpenTime,
        FacilityOpeningStatus status,
        LocalDateTime openedAt,
        LocalDateTime closedAt,
        boolean canOpen,
        boolean canClose
) {
}
