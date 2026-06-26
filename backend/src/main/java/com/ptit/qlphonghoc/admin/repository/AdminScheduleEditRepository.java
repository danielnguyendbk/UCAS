package com.ptit.qlphonghoc.admin.repository;

import com.ptit.qlphonghoc.admin.dto.AdminScheduleUpdateRequest;

import java.util.List;
import java.util.Optional;

public interface AdminScheduleEditRepository {

    Optional<ScheduleEditContext> findContextForUpdate(Integer sectionId, Integer scheduleId);

    Optional<ScheduleEditContext> findContext(Integer sectionId, Integer scheduleId);

    boolean lecturerExists(Integer lecturerId);

    boolean classroomIsActive(Integer classroomId);

    boolean slotRangeIsValid(Integer slotStartId, Integer slotEndId);

    Optional<RoomEditRef> findRoom(Integer classroomId);

    int countRoomTimeConflicts(
            Integer scheduleId,
            Integer classroomId,
            Integer semesterId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo
    );

    List<AvailableRoomRef> findAvailableRooms(
            Integer semesterId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer fromWeekNo,
            Integer toWeekNo,
            Integer excludedScheduleId,
            Integer expectedAttendees,
            String roomType,
            Integer buildingId
    );

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
            Integer enrolledCount,
            String requiredRoomType
    ) {
    }

    record RoomEditRef(
            Integer classroomId,
            String roomCode,
            Integer capacity,
            String roomType,
            Boolean active,
            Boolean deleted
    ) {
    }

    record AvailableRoomRef(
            Integer classroomId,
            Integer buildingId,
            String buildingCode,
            String buildingName,
            String roomCode,
            Integer capacity,
            String roomType,
            String roomTypeText,
            String mainEquipment
    ) {
    }
}
