package com.ptit.qlphonghoc.admin.timetableimport.service;

import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewResponse;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.ReferenceData;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.SemesterRef;

public record TimetableImportValidationResult(
        ImportPreviewResponse preview,
        SemesterRef semester,
        ReferenceData referenceData
) {
}
