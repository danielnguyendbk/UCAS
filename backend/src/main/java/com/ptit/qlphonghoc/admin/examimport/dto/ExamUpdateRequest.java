package com.ptit.qlphonghoc.admin.examimport.dto;

public record ExamUpdateRequest(
        String examDate,
        String startTime,
        String endTime,
        Long classroomId,
        String classroomCode,
        Long mainProctorId,
        Long proctorLecturerId,
        String mainProctorCode,
        Long assistantProctorId,
        String assistantProctorCode,
        String examType,
        String examMethod,
        Integer studentCount,
        String seatRange,
        String note
) {}
