package com.ptit.qlphonghoc.classsession.dto;

import java.time.LocalDate;

public record ClassSessionResponse(
        Long classSessionId,
        Long scheduleId,
        Long sectionId,
        String courseCode,
        String courseName,
        String sectionCode,
        String classCode,
        String className,
        Long lecturerId,
        String lecturerName,
        Long roomId,
        String roomCode,
        LocalDate sessionDate,
        Integer weekNo,
        Integer slotStart,
        Integer slotEnd,
        String startTime,
        String endTime,
        String sessionType,
        Integer practiceGroupNo,
        String sessionStatus,
        String note
) {}
