package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.staff.dto.allocation.ManualAssignRequest;
import com.ptit.qlphonghoc.staff.repository.StaffAllocationRepository;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableMutationPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;

class StaffAllocationServiceTest {

    private StaffAllocationRepository repository;
    private StaffAllocationService service;
    private TimetableMutationPolicy mutationPolicy;
    private StaffAllocationRepository.WeekBoundsProjection weekBounds;

    @BeforeEach
    void setUp() {
        repository = mock(StaffAllocationRepository.class);
        mutationPolicy = mock(TimetableMutationPolicy.class);
        service = new StaffAllocationService(repository, mutationPolicy);
        weekBounds = mock(StaffAllocationRepository.WeekBoundsProjection.class);
        when(weekBounds.getMinWeekNo()).thenReturn(1);
        when(weekBounds.getMaxWeekNo()).thenReturn(22);
    }

    @Test
    void manualAssignmentValidatesThenUpdates() {
        var schedule = assignmentSchedule(51, 2, 1, 22, 60, 60, "LECTURE");
        var room = assignmentRoom(15, "C-C103", "LECTURE", 80, true, false);

        when(repository.lockSchedule(51)).thenReturn(Optional.of(51));
        when(repository.findScheduleForAssignment(51)).thenReturn(Optional.of(schedule));
        when(repository.findWeekBounds(2)).thenReturn(weekBounds);
        when(repository.lockClassroom(15)).thenReturn(Optional.of(15));
        when(repository.findRoomForAssignment(15)).thenReturn(Optional.of(room));
        when(repository.countRoomTimeConflicts(51, 15, 2, "MON", 1, 4, 1, 22)).thenReturn(0);
        when(repository.countCalendarBlockConflicts(51)).thenReturn(0);
        when(repository.upsertRoomAllocation(51, 15, 2)).thenReturn(1);
        when(repository.findAllSchedulesBySemester(2)).thenReturn(List.of());
        when(repository.findCalendarBlockConflicts(2)).thenReturn(List.of());

        assertDoesNotThrow(() -> service.manualAssign(request(51, 15), 2));
        verify(repository).upsertRoomAllocation(51, 15, 2);
        verify(mutationPolicy).assertOriginalTimetableMutable(2);
    }

    @Test
    void manualAssignmentRejectsInsufficientCapacity() {
        var schedule = assignmentSchedule(49, 2, 1, 22, 60, 60, "LAB");
        var room = assignmentRoom(9, "B-B103", "LAB", 45, true, false);

        when(repository.lockSchedule(49)).thenReturn(Optional.of(49));
        when(repository.findScheduleForAssignment(49)).thenReturn(Optional.of(schedule));
        when(repository.findWeekBounds(2)).thenReturn(weekBounds);
        when(repository.lockClassroom(9)).thenReturn(Optional.of(9));
        when(repository.findRoomForAssignment(9)).thenReturn(Optional.of(room));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.manualAssign(request(49, 9), 2)
        );
        assertTrue(exception.getMessage().startsWith("CAPACITY_EXCEEDED"));
    }

    @Test
    void autoAssignmentPassesTargetWeekRangeToAvailabilityQuery() {
        var schedule = assignmentSchedule(99, 2, 3, 7, 60, 60, "LAB");

        when(repository.findUnassignedScheduleIds(2)).thenReturn(List.of(99));
        when(repository.lockSchedule(99)).thenReturn(Optional.of(99));
        when(repository.findScheduleForAssignment(99)).thenReturn(Optional.of(schedule));
        when(repository.findWeekBounds(2)).thenReturn(weekBounds);
        when(repository.countCalendarBlockConflicts(99)).thenReturn(0);
        when(repository.findAvailableRoomForAutoAssign(2, "MON", 1, 4, 3, 7, 99, "LAB", 60))
                .thenReturn(Optional.of(9));
        when(repository.lockClassroom(9)).thenReturn(Optional.of(9));
        when(repository.countRoomTimeConflicts(99, 9, 2, "MON", 1, 4, 3, 7)).thenReturn(0);
        when(repository.upsertRoomAllocation(99, 9, 2)).thenReturn(1);
        when(repository.findAllSchedulesBySemester(2)).thenReturn(List.of());
        when(repository.findCalendarBlockConflicts(2)).thenReturn(List.of());

        service.autoAssign(2, 2);

        verify(repository).findAvailableRoomForAutoAssign(2, "MON", 1, 4, 3, 7, 99, "LAB", 60);
        verify(mutationPolicy).assertOriginalTimetableMutable(2);
    }

    @Test
    void conflictReportIgnoresSameRoomWhenWeekRangesDoNotOverlap() {
        var left = allocationSchedule(1, 10, 15, 1, 5);
        var right = allocationSchedule(2, 11, 15, 6, 10);
        when(repository.findAllSchedulesBySemester(2)).thenReturn(List.of(left, right));
        when(repository.findWeekBounds(2)).thenReturn(weekBounds);
        when(repository.findCalendarBlockConflicts(2)).thenReturn(List.of());

        var conflicts = service.getConflicts(2);

        assertTrue(conflicts.stream().noneMatch(c -> "ROOM_TIME_CONFLICT".equals(c.getConflictType())));
    }

    @Test
    void conflictReportDetectsSameRoomWhenWeekRangesOverlap() {
        var left = allocationSchedule(1, 10, 15, 1, 5);
        var right = allocationSchedule(2, 11, 15, 5, 10);
        when(repository.findAllSchedulesBySemester(2)).thenReturn(List.of(left, right));
        when(repository.findWeekBounds(2)).thenReturn(weekBounds);
        when(repository.findCalendarBlockConflicts(2)).thenReturn(List.of());

        var conflicts = service.getConflicts(2);

        long roomConflicts = conflicts.stream()
                .filter(c -> "ROOM_TIME_CONFLICT".equals(c.getConflictType()))
                .count();
        assertEquals(2, roomConflicts);
        verify(repository, never()).markSchedulesValid(2);
        verify(repository, never()).markScheduleConflict(anyInt(), anyString());
    }

    @Test
    void explicitValidationUpdatesStatusesAndReturnsSummary() {
        var left = allocationSchedule(1, 10, 15, 1, 5);
        var right = allocationSchedule(2, 11, 15, 5, 10);
        when(repository.findAllSchedulesBySemester(2)).thenReturn(List.of(left, right));
        when(repository.findWeekBounds(2)).thenReturn(weekBounds);
        when(repository.findCalendarBlockConflicts(2)).thenReturn(List.of());

        var summary = service.validateAllocations(2);

        assertEquals(2, summary.totalSchedules());
        assertEquals(0, summary.validCount());
        assertEquals(2, summary.conflictCount());
        assertEquals(2, summary.conflictTypeCounts().get("ROOM_TIME_CONFLICT"));
        verify(repository).markSchedulesValid(2);
        verify(repository).markScheduleConflict(1, "ROOM_TIME_CONFLICT");
        verify(repository).markScheduleConflict(2, "ROOM_TIME_CONFLICT");
        verify(mutationPolicy).assertOriginalTimetableMutable(2);
    }

    private StaffAllocationRepository.AssignmentScheduleProjection assignmentSchedule(
            int scheduleId,
            int semesterId,
            int fromWeek,
            int toWeek,
            int enrolledCount,
            int maxCapacity,
            String roomType
    ) {
        var schedule = mock(StaffAllocationRepository.AssignmentScheduleProjection.class);
        when(schedule.getScheduleId()).thenReturn(scheduleId);
        when(schedule.getSemesterId()).thenReturn(semesterId);
        when(schedule.getSectionStatus()).thenReturn("ACTIVE");
        when(schedule.getScheduleStatus()).thenReturn("UNASSIGNED");
        when(schedule.getDayOfWeekCode()).thenReturn("MON");
        when(schedule.getSlotStartId()).thenReturn(1);
        when(schedule.getSlotEndId()).thenReturn(4);
        when(schedule.getSlotStartNumber()).thenReturn(1);
        when(schedule.getSlotEndNumber()).thenReturn(4);
        when(schedule.getStartTime()).thenReturn(LocalTime.of(7, 0));
        when(schedule.getEndTime()).thenReturn(LocalTime.of(10, 0));
        when(schedule.getFromWeekNo()).thenReturn(fromWeek);
        when(schedule.getToWeekNo()).thenReturn(toWeek);
        when(schedule.getEnrolledCount()).thenReturn(enrolledCount);
        when(schedule.getMaxCapacity()).thenReturn(maxCapacity);
        when(schedule.getRequiredRoomType()).thenReturn(roomType);
        return schedule;
    }

    private StaffAllocationRepository.AssignmentRoomProjection assignmentRoom(
            int roomId,
            String roomCode,
            String roomType,
            int capacity,
            boolean active,
            boolean deleted
    ) {
        var room = mock(StaffAllocationRepository.AssignmentRoomProjection.class);
        when(room.getClassroomId()).thenReturn(roomId);
        when(room.getRoomCode()).thenReturn(roomCode);
        when(room.getRoomType()).thenReturn(roomType);
        when(room.getCapacity()).thenReturn(capacity);
        when(room.getActive()).thenReturn(active);
        when(room.getDeleted()).thenReturn(deleted);
        return room;
    }

    private StaffAllocationRepository.AllocationProjection allocationSchedule(
            int scheduleId,
            int lecturerId,
            int classroomId,
            int fromWeek,
            int toWeek
    ) {
        var schedule = mock(StaffAllocationRepository.AllocationProjection.class);
        when(schedule.getScheduleId()).thenReturn(scheduleId);
        when(schedule.getSectionId()).thenReturn(scheduleId);
        when(schedule.getSemesterId()).thenReturn(2);
        when(schedule.getLecturerId()).thenReturn(lecturerId);
        when(schedule.getLecturerName()).thenReturn("Lecturer " + lecturerId);
        when(schedule.getClassCode()).thenReturn("COURSE.L" + scheduleId);
        when(schedule.getSectionCode()).thenReturn(String.valueOf(scheduleId));
        when(schedule.getCourseName()).thenReturn("Course " + scheduleId);
        when(schedule.getDayOfWeek()).thenReturn("Thu 2");
        when(schedule.getDayOfWeekCode()).thenReturn("MON");
        when(schedule.getSlotNumber()).thenReturn(1);
        when(schedule.getSlotEndNumber()).thenReturn(4);
        when(schedule.getStartTime()).thenReturn(LocalTime.of(7, 0));
        when(schedule.getEndTime()).thenReturn(LocalTime.of(10, 0));
        when(schedule.getFromWeekNo()).thenReturn(fromWeek);
        when(schedule.getToWeekNo()).thenReturn(toWeek);
        when(schedule.getAllocationId()).thenReturn(classroomId);
        when(schedule.getAssignedRoom()).thenReturn("C-C103");
        when(schedule.getRoomActive()).thenReturn(true);
        when(schedule.getRoomDeleted()).thenReturn(false);
        when(schedule.getAssignedRoomType()).thenReturn("LECTURE");
        when(schedule.getRequiredRoomType()).thenReturn("LECTURE");
        when(schedule.getRoomCapacity()).thenReturn(80);
        when(schedule.getEnrolledCount()).thenReturn(60);
        when(schedule.getMaxCapacity()).thenReturn(60);
        when(schedule.getScheduleStatus()).thenReturn("ASSIGNED");
        return schedule;
    }

    private ManualAssignRequest request(int scheduleId, int classroomId) {
        ManualAssignRequest request = new ManualAssignRequest();
        request.setScheduleId(scheduleId);
        request.setClassroomId(classroomId);
        return request;
    }
}
