package com.ptit.qlphonghoc.admin.service;

import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionRequest;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionRequest.SplitPart;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.RoomRef;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.SlotRef;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.SplitContext;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.WeekBoundsRef;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.service.WorkflowAuditLogger;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminSectionSplitServiceTest {

    private AdminSectionSplitRepository repository;
    private WorkflowAuditLogger auditLogger;
    private AdminSectionSplitService service;

    @BeforeEach
    void setUp() {
        repository = mock(AdminSectionSplitRepository.class);
        auditLogger = mock(WorkflowAuditLogger.class);
        service = new AdminSectionSplitService(repository, auditLogger);
    }

    @Test
    void splitUpdatesOriginalAndCreatesUnassignedPart() {
        mockValidLookups();
        when(repository.updateOriginalSection(101, "01-1", 48, 6)).thenReturn(1);
        when(repository.updateOriginalSchedule(
                101, 123, "MON", 1, 4, null, 1, "[SPLIT_PART] Tách từ BUS102.L01"
        )).thenReturn(1);
        when(repository.insertSection(any(), anyString(), anyInt(), anyInt())).thenReturn(150);
        when(repository.insertSchedule(150, context(), "TUE", 1, 4, null, 1, "[SPLIT_PART] Tách từ BUS102.L01"))
                .thenReturn(180);
        when(repository.markSemesterDraft(2)).thenReturn(1);

        var response = service.split(101, validRequest(), 1);

        assertEquals(List.of(150), response.createdSectionIds());
        assertEquals(List.of(123, 180), response.updatedScheduleIds());
        assertEquals("DRAFT", response.timetableStatus());
        verify(auditLogger).logWorkflowTransition(
                1,
                AuditAction.UPDATE,
                2,
                "CONFLICT",
                "DRAFT",
                "Admin split class section due to capacity conflict."
        );
    }

    @Test
    void splitAssignsSuggestedRoomsWhenProvided() {
        mockValidLookups();
        when(repository.findRoom(40)).thenReturn(Optional.of(new RoomRef(40, "A-101", 60, "LECTURE", true, false)));
        when(repository.findRoom(41)).thenReturn(Optional.of(new RoomRef(41, "A-102", 60, "LECTURE", true, false)));
        when(repository.roomHasOverlap(anyInt(), anyInt(), anyString(), anyInt(), anyInt(), any(), any(), anyInt()))
                .thenReturn(false);
        when(repository.updateOriginalSection(101, "01-1", 48, 6)).thenReturn(1);
        when(repository.updateOriginalSchedule(
                101, 123, "MON", 1, 4, 40, 1, "[SPLIT_PART] Tách từ BUS102.L01"
        )).thenReturn(1);
        when(repository.insertSection(any(), anyString(), anyInt(), anyInt())).thenReturn(150);
        when(repository.insertSchedule(150, context(), "TUE", 1, 4, 41, 1, "[SPLIT_PART] Tách từ BUS102.L01"))
                .thenReturn(180);
        when(repository.markSemesterDraft(2)).thenReturn(1);

        var response = service.split(101, assignedRequest(), 1);

        assertEquals(List.of(123, 180), response.updatedScheduleIds());
        verify(repository).updateOriginalSchedule(
                101, 123, "MON", 1, 4, 40, 1, "[SPLIT_PART] Tách từ BUS102.L01"
        );
    }

    @Test
    void splitRejectsStudentTotalMismatch() {
        mockValidLookups();
        AdminSplitSectionRequest request = new AdminSplitSectionRequest(
                123,
                List.of(
                        part("BUS102.L01-1", 40, 6, "MON"),
                        part("BUS102.L01-2", 40, 7, "TUE")
                ),
                true
        );

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.split(101, request, 1)
        );

        assertEquals("INVALID_SPLIT_TOTAL", exception.getErrorCode());
        verify(repository, never()).updateOriginalSection(anyInt(), anyString(), anyInt(), anyInt());
    }

    @Test
    void splitRejectsOverlappingPartsForSameLecturer() {
        mockValidLookups();
        AdminSplitSectionRequest request = new AdminSplitSectionRequest(
                123,
                List.of(
                        part("BUS102.L01-1", 48, 6, "MON"),
                        part("BUS102.L01-2", 47, 6, "MON")
                ),
                true
        );

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.split(101, request, 1)
        );

        assertEquals("LECTURER_TIME_CONFLICT", exception.getErrorCode());
    }

    @Test
    void splitRejectsApprovedWorkflow() {
        SplitContext approved = new SplitContext(
                2, "APPROVED", 10, "BUS102", "01", "D22QT01",
                95, "MON", 1, 4, 1, 4, 1, 16, "THEORY", 0, "LECTURE"
        );
        when(repository.findContextForUpdate(101, 123)).thenReturn(Optional.of(approved));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.split(101, validRequest(), 1)
        );

        assertEquals("TIMETABLE_NOT_EDITABLE", exception.getErrorCode());
    }

    private void mockValidLookups() {
        when(repository.findContextForUpdate(101, 123)).thenReturn(Optional.of(context()));
        when(repository.lecturerExists(anyInt())).thenReturn(true);
        when(repository.sectionCodeExists(anyInt(), anyInt(), anyString(), anyInt())).thenReturn(false);
        when(repository.resolveSlot(1, null)).thenReturn(Optional.of(new SlotRef(1, 1)));
        when(repository.resolveSlot(4, null)).thenReturn(Optional.of(new SlotRef(4, 4)));
        when(repository.lecturerHasOverlap(
                anyInt(), anyInt(), anyString(), anyInt(), anyInt(), any(), any(), anyInt()
        )).thenReturn(false);
        when(repository.countCalendarBlockConflicts(anyInt(), anyString(), any(), any())).thenReturn(0);
        when(repository.findWeekBounds(anyInt())).thenReturn(new WeekBoundsRef(1, 16));
    }

    private AdminSplitSectionRequest validRequest() {
        return new AdminSplitSectionRequest(
                123,
                List.of(
                        part("BUS102.L01-1", 48, 6, "MON"),
                        part("BUS102.L01-2", 47, 7, "TUE")
                ),
                true
        );
    }

    private AdminSplitSectionRequest assignedRequest() {
        return new AdminSplitSectionRequest(
                123,
                List.of(
                        part("BUS102.L01-1", 48, 6, "MON", 40),
                        part("BUS102.L01-2", 47, 7, "TUE", 41)
                ),
                true
        );
    }

    private SplitPart part(String code, int students, int lecturerId, String day) {
        return part(code, students, lecturerId, day, null);
    }

    private SplitPart part(String code, int students, int lecturerId, String day, Integer classroomId) {
        return new SplitPart(code, students, lecturerId, day, 1, null, 4, null, classroomId);
    }

    private SplitContext context() {
        return new SplitContext(
                2, "CONFLICT", 10, "BUS102", "01", "D22QT01",
                95, "MON", 1, 4, 1, 4, 1, 16, "THEORY", 0, "LECTURE"
        );
    }
}
