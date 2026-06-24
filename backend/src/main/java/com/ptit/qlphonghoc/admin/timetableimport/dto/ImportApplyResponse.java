package com.ptit.qlphonghoc.admin.timetableimport.dto;

public record ImportApplyResponse(
        String importBatchCode,
        String importMode,
        Long semesterId,
        String semesterCode,
        int totalRows,
        int createdSections,
        int updatedSections,
        int createdSchedules,
        int updatedSchedules,
        int cancelledSchedules,
        int cancelledSections,
        int unchangedRows,
        int skippedRows,
        int retainedClassroomAssignments,
        int unassignedSchedules,
        String timetableStatus
) {
}
