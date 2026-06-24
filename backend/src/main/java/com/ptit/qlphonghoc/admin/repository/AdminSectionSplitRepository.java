package com.ptit.qlphonghoc.admin.repository;

import java.util.Optional;

public interface AdminSectionSplitRepository {

    Optional<SplitContext> findContextForUpdate(Integer sectionId, Integer scheduleId);

    boolean lecturerExists(Integer lecturerId);

    Optional<SlotRef> resolveSlot(Integer slotId, Integer slotNo);

    boolean sectionCodeExists(Integer semesterId, Integer courseId, String sectionCode, Integer excludedSectionId);

    boolean lecturerHasOverlap(
            Integer semesterId,
            Integer lecturerId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo,
            Integer excludedScheduleId
    );

    int updateOriginalSection(
            Integer sectionId,
            String sectionCode,
            Integer studentCount,
            Integer lecturerId
    );

    int updateOriginalSchedule(
            Integer sectionId,
            Integer scheduleId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            String note
    );

    Integer insertSection(SplitContext context, String sectionCode, Integer studentCount, Integer lecturerId);

    Integer insertSchedule(
            Integer sectionId,
            SplitContext context,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            String note
    );

    int markSemesterDraft(Integer semesterId);

    record SplitContext(
            Integer semesterId,
            String timetableStatus,
            Integer courseId,
            String courseCode,
            String sectionCode,
            String className,
            Integer enrolledCount,
            Integer fromWeekNo,
            Integer toWeekNo,
            String sessionType,
            Integer practiceGroupNo
    ) {
    }

    record SlotRef(Integer id, Integer number) {
    }
}
