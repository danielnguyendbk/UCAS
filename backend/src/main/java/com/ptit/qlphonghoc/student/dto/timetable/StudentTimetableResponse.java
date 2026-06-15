package com.ptit.qlphonghoc.student.dto.timetable;

public record StudentTimetableResponse(
        Integer id,
        Integer scheduleId,
        Integer sectionId,
        Integer semesterId,
        String courseCode,
        String courseName,
        String sectionCode,
        String classCode,
        Integer credits,
        String lecturerName,
        Integer roomId,
        String roomCode,
        String roomName,
        String buildingCode,
        String buildingName,
        String dayCode,
        String dayOfWeek,
        Integer slotStartId,
        Integer slotEndId,
        Integer slotStart,
        Integer slotEnd,
        String timeSlotName,
        String startTime,
        String endTime,
        Integer fromWeekNo,
        Integer toWeekNo,
        String status
) {
}
