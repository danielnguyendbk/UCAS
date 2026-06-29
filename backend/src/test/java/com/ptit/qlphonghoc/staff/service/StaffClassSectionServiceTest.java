package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.staff.dto.class_section.CreateSectionRequest;
import com.ptit.qlphonghoc.staff.dto.class_section.UpdateSectionRequest;
import com.ptit.qlphonghoc.staff.entity.ClassSection;
import com.ptit.qlphonghoc.staff.repository.ClassSectionRepository;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableMutationPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StaffClassSectionServiceTest {

    private ClassSectionRepository repository;
    private TimetableMutationPolicy mutationPolicy;
    private StaffClassSectionService service;

    @BeforeEach
    void setUp() {
        repository = mock(ClassSectionRepository.class);
        mutationPolicy = mock(TimetableMutationPolicy.class);
        service = new StaffClassSectionService(repository, mutationPolicy);
    }

    @Test
    void createIsBlockedBeforeWritingPublishedSemester() {
        CreateSectionRequest request = new CreateSectionRequest();
        request.setSemesterId(2);
        doThrow(new BadRequestException("blocked"))
                .when(mutationPolicy).assertOriginalTimetableMutable(2);

        assertThrows(BadRequestException.class, () -> service.create(request));
        verify(repository, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void updateGuardsExistingSemesterBeforeChangingSection() {
        ClassSection section = section(10, 2);
        when(repository.findById(10)).thenReturn(Optional.of(section));
        doThrow(new BadRequestException("blocked"))
                .when(mutationPolicy).assertOriginalTimetableMutable(2);

        assertThrows(BadRequestException.class, () -> service.update(10, new UpdateSectionRequest()));
        verify(repository, never()).saveAndFlush(section);
    }

    @Test
    void deleteGuardsSemesterBeforeCancellingSchedule() {
        ClassSection section = section(10, 2);
        when(repository.findById(10)).thenReturn(Optional.of(section));
        doThrow(new BadRequestException("blocked"))
                .when(mutationPolicy).assertOriginalTimetableMutable(2);

        assertThrows(BadRequestException.class, () -> service.delete(10));
        verify(repository, never()).deactivateSchedulesOfSection(10);
    }

    private ClassSection section(Integer id, Integer semesterId) {
        ClassSection section = new ClassSection();
        section.setId(id);
        section.setSemesterId(semesterId);
        return section;
    }
}
