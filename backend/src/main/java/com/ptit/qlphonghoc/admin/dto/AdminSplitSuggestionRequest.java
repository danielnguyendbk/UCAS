package com.ptit.qlphonghoc.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdminSplitSuggestionRequest(
        @NotNull Integer scheduleId,
        @NotNull @Positive Integer partCount,
        @NotNull @Size(min = 2, max = 5) List<@Valid SuggestionPart> parts
) {

    public record SuggestionPart(
            String sectionCode,
            @NotNull @Positive Integer studentCount,
            @NotNull Integer lecturerId
    ) {
    }
}
