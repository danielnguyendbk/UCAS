package com.ptit.qlphonghoc.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdminSplitSectionRequest(
        @NotNull Integer scheduleId,
        @NotNull @Size(min = 2, max = 3) List<@Valid SplitPart> parts,
        Boolean clearRoomAssignments
) {

    public record SplitPart(
            @NotBlank @Size(max = 40) String sectionCode,
            @NotNull @Positive Integer studentCount,
            @NotNull Integer lecturerId,
            @NotBlank String dayOfWeek,
            Integer slotStartId,
            Integer slotStartNo,
            Integer slotEndId,
            Integer slotEndNo
    ) {
    }
}
