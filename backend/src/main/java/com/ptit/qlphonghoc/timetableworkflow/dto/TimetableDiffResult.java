package com.ptit.qlphonghoc.timetableworkflow.dto;

import java.util.List;

public record TimetableDiffResult(
        long semesterId,
        String semesterName,
        int versionA,
        int versionB,
        List<SectionDiff> addedSections,
        List<SectionDiff> modifiedSections,
        List<ScheduleDiff> addedSchedules,
        List<ScheduleDiff> modifiedSchedules,
        List<ScheduleDiff> removedSchedules
) {
    public record SectionDiff(
            long sectionId,
            String sectionCode,
            String className,
            String courseCode,
            String lecturerCode,
            String status
    ) {}

    public record ScheduleDiff(
            long scheduleId,
            long sectionId,
            String sectionCode,
            String courseCode,
            String dayOfWeek,
            String slotStart,
            String slotEnd,
            String sessionType,
            String classroomCode,
            String status
    ) {}
}
