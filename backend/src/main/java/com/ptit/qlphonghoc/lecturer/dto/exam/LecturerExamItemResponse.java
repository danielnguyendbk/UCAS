package com.ptit.qlphonghoc.lecturer.dto.exam;

public record LecturerExamItemResponse(
        Long examId,
        String courseCode,
        String courseName,
        String sectionCode,
        String examDate,
        String startTime,
        String endTime,
        String classroomCode,
        String classroomName,
        String buildingCode,
        String examType,
        String examMethod,
        String role,
        String note
) {}
