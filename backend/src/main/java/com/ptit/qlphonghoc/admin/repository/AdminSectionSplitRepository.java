package com.ptit.qlphonghoc.admin.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AdminSectionSplitRepository {

    Optional<SplitContext> findContextForUpdate(Integer sectionId, Integer scheduleId);

    Optional<SplitContext> findContext(Integer sectionId, Integer scheduleId);

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

    boolean roomHasOverlap(
            Integer semesterId,
            Integer classroomId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo,
            Integer excludedScheduleId
    );

    Optional<RoomRef> findRoom(Integer classroomId);

    List<RoomRef> findAvailableRooms(
            Integer semesterId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo,
            Integer excludedScheduleId,
            String roomType,
            Integer requiredCapacity,
            Collection<Integer> excludedRoomIds,
            Integer limit
    );

    List<SlotRangeRef> findSlotRanges(Integer slotSpan);

    WeekBoundsRef findWeekBounds(Integer semesterId);

    int countCalendarBlockConflicts(
            Integer semesterId,
            String dayOfWeek,
            Integer fromWeekNo,
            Integer toWeekNo
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
            Integer classroomId,
            Integer assignedBy,
            String note
    );

    Integer insertSection(SplitContext context, String sectionCode, Integer studentCount, Integer lecturerId);

    Integer insertSchedule(
            Integer sectionId,
            SplitContext context,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer classroomId,
            Integer assignedBy,
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
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer slotStartNo,
            Integer slotEndNo,
            Integer fromWeekNo,
            Integer toWeekNo,
            String sessionType,
            Integer practiceGroupNo,
            String requiredRoomType
    ) {
    }

    record SlotRef(Integer id, Integer number) {
    }

    record SlotRangeRef(Integer startId, Integer endId, Integer startNo, Integer endNo) {
    }

    record RoomRef(Integer id, String code, Integer capacity, String roomType, Boolean active, Boolean deleted) {
    }

    record WeekBoundsRef(Integer minWeekNo, Integer maxWeekNo) {
    }

    record LecturerRef(
            Integer lecturerId,
            String lecturerCode,
            String fullName,
            Integer departmentId
    ) {
        public Integer getLecturerId() {
            return lecturerId;
        }

        public String getLecturerCode() {
            return lecturerCode;
        }

        public String getFullName() {
            return fullName;
        }

        public Integer getDepartmentId() {
            return departmentId;
        }
    }

    @Query(value = """
    SELECT 
        l.lecturer_id AS lecturerId,
        l.lecturer_code AS lecturerCode,
        l.full_name AS fullName,
        l.department_id AS departmentId
    FROM lecturers l
    JOIN courses c ON c.department_id = l.department_id
    WHERE c.course_id = :courseId
      AND l.is_deleted = FALSE
    ORDER BY l.lecturer_code
    """, nativeQuery = true)
    List<LecturerRef> findEligibleLecturersByCourse(@Param("courseId") Integer courseId);


    @Query(value = """
    SELECT COUNT(*)
    FROM lecturers l
    JOIN courses c ON c.department_id = l.department_id
    WHERE l.lecturer_id = :lecturerId
      AND c.course_id = :courseId
      AND l.is_deleted = FALSE
    """, nativeQuery = true)
    int countLecturerEligibleForCourse(
            @Param("lecturerId") Integer lecturerId,
            @Param("courseId") Integer courseId
    );


}
