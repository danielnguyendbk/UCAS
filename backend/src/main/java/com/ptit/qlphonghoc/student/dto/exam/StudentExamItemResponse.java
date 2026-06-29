package com.ptit.qlphonghoc.student.dto.exam;

public record StudentExamItemResponse(
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
        String note
) {}
