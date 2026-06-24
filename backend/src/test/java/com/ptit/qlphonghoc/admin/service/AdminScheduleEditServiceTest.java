package com.ptit.qlphonghoc.admin.service;

import com.ptit.qlphonghoc.admin.dto.AdminScheduleUpdateRequest;
import com.ptit.qlphonghoc.admin.repository.AdminScheduleEditRepository;
import com.ptit.qlphonghoc.admin.repository.AdminScheduleEditRepository.ScheduleEditContext;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.service.WorkflowAuditLogger;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.service.ClassSectionTableReader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminScheduleEditServiceTest {

    private AdminScheduleEditRepository repository;
    private ClassSectionTableReader classSectionReader;
    private WorkflowAuditLogger auditLogger;
    private AdminScheduleEditService service;

    @BeforeEach
    void setUp() {
        repository = mock(AdminScheduleEditRepository.class);
        classSectionReader = mock(ClassSectionTableReader.class);
        auditLogger = mock(WorkflowAuditLogger.class);
        service = new AdminScheduleEditService(repository, classSectionReader, auditLogger);
    }

    @Test
    void updateResetsScheduleAndKeepsSemesterDraft() {
        AdminScheduleUpdateRequest request = request(12, 40, 1, 16);
        StaffSectionTableResponse response = new StaffSectionTableResponse();
        response.setId(7);
        when(repository.findContextForUpdate(7, 9))
                .thenReturn(Optional.of(new ScheduleEditContext(2, "CONFLICT", 35)));
        when(repository.lecturerExists(12)).thenReturn(true);
        when(repository.classroomIsActive(40)).thenReturn(true);
        when(repository.slotRangeIsValid(1, 3)).thenReturn(true);
        when(repository.updateSchedule(eq(7), eq(9), eq(request), eq("MON"), eq(1), eq("note")))
                .thenReturn(1);
        when(classSectionReader.getById(7)).thenReturn(response);

        StaffSectionTableResponse result = service.update(7, 9, request, 1);

        assertEquals(7, result.getId());
        verify(repository).markSemesterDraft(2);
        verify(auditLogger).logWorkflowTransition(
                1, AuditAction.UPDATE, 2, "CONFLICT", "DRAFT", "Admin updated reopened timetable schedule 9"
        );
    }

    @Test
    void updateRejectsApprovedTimetable() {
        when(repository.findContextForUpdate(7, 9))
                .thenReturn(Optional.of(new ScheduleEditContext(2, "APPROVED", 35)));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.update(7, 9, request(12, 40, 1, 16), 1)
        );

        assertEquals("TIMETABLE_NOT_EDITABLE", exception.getErrorCode());
        verify(repository, never()).updateSchedule(any(), any(), any(), any(), any(), any());
    }

    @Test
    void updateRejectsInvalidWeekRange() {
        AdminScheduleUpdateRequest request = request(12, 40, 16, 1);
        when(repository.findContextForUpdate(7, 9))
                .thenReturn(Optional.of(new ScheduleEditContext(2, "DRAFT", 35)));
        when(repository.lecturerExists(12)).thenReturn(true);
        when(repository.classroomIsActive(40)).thenReturn(true);
        when(repository.slotRangeIsValid(1, 3)).thenReturn(true);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.update(7, 9, request, 1)
        );

        assertEquals("INVALID_WEEK_RANGE", exception.getErrorCode());
    }

    private AdminScheduleUpdateRequest request(
            Integer lecturerId,
            Integer classroomId,
            Integer fromWeek,
            Integer toWeek
    ) {
        return new AdminScheduleUpdateRequest(
                lecturerId,
                "MON",
                1,
                3,
                classroomId,
                fromWeek,
                toWeek,
                40,
                "note"
        );
    }
}
