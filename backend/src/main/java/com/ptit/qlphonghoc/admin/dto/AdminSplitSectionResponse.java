package com.ptit.qlphonghoc.admin.dto;

import java.util.List;

public record AdminSplitSectionResponse(
        Integer originalSectionId,
        List<Integer> createdSectionIds,
        List<Integer> updatedScheduleIds,
        String timetableStatus,
        String message
) {
}
