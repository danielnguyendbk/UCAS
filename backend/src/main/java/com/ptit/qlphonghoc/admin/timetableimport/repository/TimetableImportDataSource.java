package com.ptit.qlphonghoc.admin.timetableimport.repository;

import java.util.Optional;

public interface TimetableImportDataSource {
    Optional<TimetableImportReadRepository.SemesterRef> findSemester(Long semesterId, String semesterCode);
    TimetableImportReadRepository.ReferenceData loadReferenceData(long semesterId);
}
