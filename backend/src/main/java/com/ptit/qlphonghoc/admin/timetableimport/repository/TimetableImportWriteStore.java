package com.ptit.qlphonghoc.admin.timetableimport.repository;

import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.SemesterRef;

import java.time.LocalTime;
import java.util.Optional;

public interface TimetableImportWriteStore {

    Optional<SemesterRef> lockSemester(long semesterId);
    long insertSection(SectionWrite row);
    void updateSection(long sectionId, SectionWrite row);
    long insertSchedule(ScheduleWrite row);
    void updateSchedule(long scheduleId, ScheduleWrite row);
    int softCancelSchedule(long scheduleId, String note);
    void markSemesterDraft(long semesterId);

    record SectionWrite(
            long semesterId,
            long courseId,
            long lecturerId,
            String sectionCode,
            String className,
            int enrolledCount,
            int maxCapacity,
            String importSource,
            String importBatchCode
    ) {}

    record ScheduleWrite(
            long sectionId,
            Long classroomId,
            String dayOfWeek,
            long slotStartId,
            long slotEndId,
            LocalTime startTime,
            LocalTime endTime,
            Integer fromWeekNo,
            Integer toWeekNo,
            String sessionType,
            int practiceGroupNo,
            String status
    ) {}
}
