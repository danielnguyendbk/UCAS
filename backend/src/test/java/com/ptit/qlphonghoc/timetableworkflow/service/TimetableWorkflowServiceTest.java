package com.ptit.qlphonghoc.timetableworkflow.service;

import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.service.WorkflowAuditLogger;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.staff.dto.allocation.AllocationValidationSummary;
import com.ptit.qlphonghoc.staff.service.AllocationValidationService;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowRepository.SemesterWorkflowState;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowRepository.ValidationCounts;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TimetableWorkflowServiceTest {

    private TimetableWorkflowStore repository;
    private AllocationValidationService allocationService;
    private WorkflowAuditLogger auditLogService;
    private TimetableWorkflowService service;

    @BeforeEach
    void setUp() {
        repository = mock(TimetableWorkflowStore.class);
        allocationService = mock(AllocationValidationService.class);
        auditLogService = mock(WorkflowAuditLogger.class);
        service = new TimetableWorkflowService(repository, allocationService, auditLogService);
    }

    @Test
    void submitPersistsConflictAndDoesNotRequestApproval() {
        when(repository.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.DRAFT)));
        when(repository.updateStatus(2, TimetableWorkflowStatus.VALIDATING)).thenReturn(1);
        when(repository.updateStatus(2, TimetableWorkflowStatus.CONFLICT)).thenReturn(1);
        when(allocationService.validateAllocations(2)).thenReturn(
                new AllocationValidationSummary(48, 16, 32, Map.of("ROOM_TYPE_MISMATCH", 28))
        );

        var summary = service.submit(2, 2);

        assertEquals("CONFLICT", summary.timetableStatus());
        assertEquals(32, summary.conflictCount());
        verify(auditLogService, never()).logWorkflowTransition(
                2, AuditAction.REQUEST, 2, "DRAFT", "READY_FOR_APPROVAL", "Staff submitted timetable for approval"
        );
    }

    @Test
    void submitValidTimetableMovesToReadyForApprovalAndAudits() {
        when(repository.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.DRAFT)));
        when(repository.updateStatus(2, TimetableWorkflowStatus.VALIDATING)).thenReturn(1);
        when(repository.updateStatus(2, TimetableWorkflowStatus.READY_FOR_APPROVAL)).thenReturn(1);
        when(allocationService.validateAllocations(2)).thenReturn(
                new AllocationValidationSummary(48, 48, 0, Map.of())
        );

        var summary = service.submit(2, 2);

        assertEquals("READY_FOR_APPROVAL", summary.timetableStatus());
        verify(auditLogService).logWorkflowTransition(
                2, AuditAction.REQUEST, 2, "DRAFT", "READY_FOR_APPROVAL", "Staff submitted timetable for approval"
        );
    }

    @Test
    void approveRequiresReadyForApproval() {
        when(repository.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.DRAFT)));

        assertThrows(BadRequestException.class, () -> service.approve(2, 1));
        verify(repository, never()).updateStatus(2, TimetableWorkflowStatus.APPROVED);
    }

    @Test
    void approveMovesReadyTimetableToApproved() {
        when(repository.findSemester(2, true))
                .thenReturn(Optional.of(state(TimetableWorkflowStatus.READY_FOR_APPROVAL)));
        when(repository.updateStatus(2, TimetableWorkflowStatus.APPROVED)).thenReturn(1);
        when(repository.findValidationCounts(2)).thenReturn(new ValidationCounts(48, 48, 0));

        var summary = service.approve(2, 1);

        assertEquals("APPROVED", summary.timetableStatus());
        verify(auditLogService).logWorkflowTransition(
                1, AuditAction.APPROVE, 2, "READY_FOR_APPROVAL", "APPROVED", "Admin approved timetable"
        );
    }

    @Test
    void publishRevalidatesBeforeMovingApprovedTimetableToPublished() {
        when(repository.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.APPROVED)));
        when(repository.updateStatus(2, TimetableWorkflowStatus.PUBLISHED)).thenReturn(1);
        when(allocationService.validateAllocations(2)).thenReturn(
                new AllocationValidationSummary(48, 48, 0, Map.of())
        );

        var summary = service.publish(2, 1);

        assertEquals("PUBLISHED", summary.timetableStatus());
        verify(auditLogService).logWorkflowTransition(
                1, AuditAction.UPDATE, 2, "APPROVED", "PUBLISHED", "Admin published timetable"
        );
    }

    @Test
    void lockMovesPublishedTimetableToLocked() {
        when(repository.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.PUBLISHED)));
        when(repository.updateStatus(2, TimetableWorkflowStatus.LOCKED)).thenReturn(1);
        when(repository.findValidationCounts(2)).thenReturn(new ValidationCounts(48, 48, 0));

        var summary = service.lock(2, 1);

        assertEquals("LOCKED", summary.timetableStatus());
        verify(auditLogService).logWorkflowTransition(
                1, AuditAction.UPDATE, 2, "PUBLISHED", "LOCKED", "Admin locked timetable"
        );
    }

    private SemesterWorkflowState state(TimetableWorkflowStatus status) {
        return new SemesterWorkflowState(2, "Semester 2", status);
    }
}
