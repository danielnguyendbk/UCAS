package com.ptit.qlphonghoc.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminScheduleUpdateRequest(
        Integer lecturerId,
        @NotBlank String dayOfWeek,
        @NotNull Integer slotStartId,
        @NotNull Integer slotEndId,
        Integer classroomId,
        @NotNull @Min(1) @Max(53) Integer fromWeekNo,
        @NotNull @Min(1) @Max(53) Integer toWeekNo,
        @Min(1) Integer maxCapacity,
        @Size(max = 255) String note
) {
}
