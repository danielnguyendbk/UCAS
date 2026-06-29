package com.ptit.qlphonghoc.admin.examimport.dto;

import java.util.List;

public record ExamImportPreviewResponse(
        List<ExamImportRowResult> rows,
        int totalRows,
        int validRows,
        int warningRows,
        int errorRows
) {}
