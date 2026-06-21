package com.ptit.qlphonghoc.admin.timetableimport.service;

import org.springframework.web.multipart.MultipartFile;

public interface TimetableImportValidator {
    TimetableImportValidationResult validate(MultipartFile file, Long semesterId, String semesterCode);
}
