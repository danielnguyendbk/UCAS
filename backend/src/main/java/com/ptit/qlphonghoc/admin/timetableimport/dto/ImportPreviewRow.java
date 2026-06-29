package com.ptit.qlphonghoc.admin.timetableimport.dto;

import java.util.List;
import java.util.Map;

public record ImportPreviewRow(
        int rowNumber,
        String semesterCode,
        String courseCode,
        String sectionCode,
        String className,
        String lecturerCode,
        String schedule,
        String preferredClassroomCode,
        String status,
        String operation,
        List<ImportPreviewMessage> messages,
        Map<String, String> values
) {
}
