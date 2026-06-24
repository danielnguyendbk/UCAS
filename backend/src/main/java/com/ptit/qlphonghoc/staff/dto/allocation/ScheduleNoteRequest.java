package com.ptit.qlphonghoc.staff.dto.allocation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ScheduleNoteRequest(
        @NotBlank @Size(max = 255) String note
) {
}
