package com.ptit.qlphonghoc.admin.examimport.dto;

import java.util.List;

public record ExamImportRowResult(
        int rowNumber,
        String sectionCode,
        String examDate,
        String startTime,
        String endTime,
        String classroomCode,
        String mainProctorCode,
        String assistantProctorCode,
        String examType,
        String examMethod,
        String note,
        String operation,
        String status,
        List<String> messages,
        Long existingExamId
) {}
