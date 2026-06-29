package com.ptit.qlphonghoc.admin.examworkflow.dto;

public record ExamWorkflowStatusSummary(
        Long semesterId,
        String semesterName,
        String examWorkflowStatus,
        int totalExams,
        int validCount,
        int conflictCount,
        int draftCount,
        int publishedCount
) {}
