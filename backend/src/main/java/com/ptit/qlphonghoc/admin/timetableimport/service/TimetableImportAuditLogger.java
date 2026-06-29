package com.ptit.qlphonghoc.admin.timetableimport.service;

import java.util.Map;

public interface TimetableImportAuditLogger {
    void logTimetableImport(Integer userId, Long semesterId, String importBatchCode, Map<String, Object> summary);
}
