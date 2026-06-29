package com.ptit.qlphonghoc.timetableworkflow.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowRepository.SemesterWorkflowState;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TimetableMutationGuardTest {

    private TimetableWorkflowStore workflowStore;
    private TimetableMutationGuard guard;

    @BeforeEach
    void setUp() {
        workflowStore = mock(TimetableWorkflowStore.class);
        guard = new TimetableMutationGuard(workflowStore);
    }

    @Test
    void allowsOriginalTimetableMutationBeforePublication() {
        when(workflowStore.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.APPROVED)));

        assertDoesNotThrow(() -> guard.assertOriginalTimetableMutable(2));
    }

    @Test
    void rejectsPublishedTimetableMutationWithStableCode() {
        when(workflowStore.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.PUBLISHED)));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> guard.assertOriginalTimetableMutable(2)
        );
        assertEquals(TimetableMutationGuard.PUBLISHED_ERROR_CODE, exception.getErrorCode());
        assertEquals(TimetableMutationGuard.PUBLISHED_MESSAGE, exception.getMessage());
    }

    @Test
    void rejectsLockedTimetableMutationWithStableCode() {
        when(workflowStore.findSemester(2, true)).thenReturn(Optional.of(state(TimetableWorkflowStatus.LOCKED)));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> guard.assertOriginalTimetableMutable(2)
        );
        assertEquals(TimetableMutationGuard.LOCKED_ERROR_CODE, exception.getErrorCode());
        assertEquals(TimetableMutationGuard.LOCKED_MESSAGE, exception.getMessage());
    }

    private SemesterWorkflowState state(TimetableWorkflowStatus status) {
        return new SemesterWorkflowState(2, "Semester 2", status);
    }
}
