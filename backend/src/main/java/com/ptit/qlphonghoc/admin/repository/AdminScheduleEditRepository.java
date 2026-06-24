package com.ptit.qlphonghoc.admin.repository;

import com.ptit.qlphonghoc.admin.dto.AdminScheduleUpdateRequest;

import java.util.Optional;

public interface AdminScheduleEditRepository {

    Optional<ScheduleEditContext> findContextForUpdate(Integer sectionId, Integer scheduleId);

    boolean lecturerExists(Integer lecturerId);

    boolean classroomIsActive(Integer classroomId);

    boolean slotRangeIsValid(Integer slotStartId, Integer slotEndId);

    int updateSection(Integer sectionId, Integer lecturerId, Integer maxCapacity);

    int updateSchedule(
            Integer sectionId,
            Integer scheduleId,
            AdminScheduleUpdateRequest request,
            String dayOfWeek,
            Integer adminUserId,
            String note
    );

    int markSemesterDraft(Integer semesterId);

    record ScheduleEditContext(
            Integer semesterId,
            String timetableStatus,
            Integer enrolledCount
    ) {
    }
}
