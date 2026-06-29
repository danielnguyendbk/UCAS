package com.ptit.qlphonghoc.admin.examimport.dto;

import java.util.List;

public record ExamImportApplyResponse(
        int inserted,
        int updated,
        int errorCount,
        List<String> errors
) {}
