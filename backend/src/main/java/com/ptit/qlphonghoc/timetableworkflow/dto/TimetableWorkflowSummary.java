package com.ptit.qlphonghoc.timetableworkflow.dto;

import java.util.Map;

public record TimetableWorkflowSummary(
        Integer semesterId,
        String semesterName,
        String timetableStatus,
        int totalSchedules,
        int validCount,
        int conflictCount,
        Map<String, Integer> conflictTypeCounts
) {
}
