package com.ptit.qlphonghoc.staff.dto.allocation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ScheduleNoteRequest(
        @NotBlank(message = "NOTE_REQUIRED")
        @Size(max = 255, message = "NOTE_TOO_LONG")
        String note
) {
}
