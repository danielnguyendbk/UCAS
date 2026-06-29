package com.ptit.qlphonghoc.staff.repository;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ClassSectionRepositoryStatusQueryTest {

    @Test
    void classSectionStatusUsesStoredValidationResultInsteadOfRecomputingRoomConflicts() {
        assertThat(ClassSectionRepository.TABLE_SELECT)
                .contains("sch.status AS scheduleStatus")
                .contains("sch.validation_status AS validationStatus")
                .contains("sch.conflict_reason AS conflictReason")
                .contains("WHEN sch.validation_status = 'CONFLICT' THEN 'CONFLICT'")
                .doesNotContain("WHEN EXISTS (");
    }
}
