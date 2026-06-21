package com.ptit.qlphonghoc.admin.timetableimport.dto;

public record ImportApplyResponse(
        String importBatchCode,
        Long semesterId,
        String semesterCode,
        int totalRows,
        int createdSections,
        int updatedSections,
        int createdSchedules,
        int updatedSchedules,
        int unchangedRows,
        int skippedRows,
        int retainedClassroomAssignments,
        String timetableStatus
) {
}
