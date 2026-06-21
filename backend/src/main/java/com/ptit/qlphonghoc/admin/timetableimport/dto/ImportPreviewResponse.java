package com.ptit.qlphonghoc.admin.timetableimport.dto;

import java.util.List;
import java.util.Map;

public record ImportPreviewResponse(
        String importBatchCode,
        Long semesterId,
        String semesterCode,
        int totalRows,
        int validRows,
        int warningRows,
        int errorRows,
        Map<String, Integer> operationSummary,
        Map<String, Integer> errorsByType,
        List<ImportPreviewRow> rows
) {
}
