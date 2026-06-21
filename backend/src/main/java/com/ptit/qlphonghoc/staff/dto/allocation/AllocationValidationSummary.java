package com.ptit.qlphonghoc.staff.dto.allocation;

import java.util.Map;

public record AllocationValidationSummary(
        int totalSchedules,
        int validCount,
        int conflictCount,
        Map<String, Integer> conflictTypeCounts
) {
}
