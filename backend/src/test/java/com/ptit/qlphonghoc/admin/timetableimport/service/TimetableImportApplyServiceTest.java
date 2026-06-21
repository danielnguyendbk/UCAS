package com.ptit.qlphonghoc.admin.timetableimport.service;

import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportApplyResponse;
import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewMessage;
import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewResponse;
import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewRow;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.*;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportWriteStore;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.dao.DuplicateKeyException;

import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TimetableImportApplyServiceTest {

    private final MockMultipartFile file = new MockMultipartFile("file", "import.csv", "text/csv", new byte[]{1});

    @Test
    void createsSectionAndScheduleFromValidatedRow() {
        FakeWriteStore store = new FakeWriteStore("DRAFT");
        TimetableImportApplyService service = service(validation(validRow("CREATE_SECTION"), referenceData(false)), store);

        ImportApplyResponse response = service.apply(file, 1L, null, 99);

        assertThat(response.createdSections()).isEqualTo(1);
        assertThat(response.createdSchedules()).isEqualTo(1);
        assertThat(response.timetableStatus()).isEqualTo("DRAFT");
        assertThat(store.draftMarked).isTrue();
    }

    @Test
    void blocksInvalidPreviewBeforeLockingSemester() {
        ImportPreviewRow row = row("ERROR", "ERROR", List.of(
                new ImportPreviewMessage("COURSE_NOT_FOUND", "ERROR", "Missing")
        ));
        FakeWriteStore store = new FakeWriteStore("DRAFT");
        TimetableImportApplyService service = service(validation(row, referenceData(false)), store);

        assertThatThrownBy(() -> service.apply(file, 1L, null, 99))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode")
                .isEqualTo("IMPORT_HAS_ERRORS");
        assertThat(store.lockCalled).isFalse();
    }

    @Test
    void rechecksLockedSemesterInsideApplyTransaction() {
        FakeWriteStore store = new FakeWriteStore("LOCKED");
        TimetableImportApplyService service = service(validation(validRow("CREATE_SECTION"), referenceData(false)), store);

        assertThatThrownBy(() -> service.apply(file, 1L, null, 99))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode")
                .isEqualTo("TIMETABLE_LOCKED");
    }

    @Test
    void retainsExistingClassroomWhenPreferenceIsBlank() {
        FakeWriteStore store = new FakeWriteStore("DRAFT");
        TimetableImportApplyService service = service(validation(validRow("NO_CHANGE"), referenceData(true)), store);

        ImportApplyResponse response = service.apply(file, 1L, null, 99);

        assertThat(response.updatedSections()).isEqualTo(1);
        assertThat(response.updatedSchedules()).isEqualTo(1);
        assertThat(response.retainedClassroomAssignments()).isEqualTo(1);
        assertThat(store.lastSchedule.classroomId()).isEqualTo(30L);
        assertThat(store.lastSchedule.status()).isEqualTo("ASSIGNED");
    }

    @Test
    void reportsConcurrentNaturalKeyConflict() {
        FakeWriteStore store = new FakeWriteStore("DRAFT") {
            @Override
            public long insertSection(SectionWrite row) {
                throw new DuplicateKeyException("duplicate natural key");
            }
        };
        TimetableImportApplyService service = service(validation(validRow("CREATE_SECTION"), referenceData(false)), store);

        assertThatThrownBy(() -> service.apply(file, 1L, null, 99))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode")
                .isEqualTo("IMPORT_CONFLICT");
    }

    private TimetableImportApplyService service(TimetableImportValidationResult result, FakeWriteStore store) {
        TimetableImportValidator validator = (ignoredFile, ignoredId, ignoredCode) -> result;
        TimetableImportAuditLogger logger = (userId, semesterId, batchCode, summary) -> { };
        return new TimetableImportApplyService(validator, store, logger);
    }

    private TimetableImportValidationResult validation(ImportPreviewRow row, ReferenceData refs) {
        int errors = "ERROR".equals(row.status()) ? 1 : 0;
        ImportPreviewResponse preview = new ImportPreviewResponse(
                "PREVIEW-TEST", 1L, "HK1", 1, errors == 0 ? 1 : 0, 0, errors,
                Map.of(row.operation(), 1), errors == 0 ? Map.of() : Map.of("COURSE_NOT_FOUND", 1), List.of(row)
        );
        return new TimetableImportValidationResult(preview, new SemesterRef(1L, "HK1", "DRAFT"), refs);
    }

    private ImportPreviewRow validRow(String operation) {
        return row("VALID", operation, List.of());
    }

    private ImportPreviewRow row(String status, String operation, List<ImportPreviewMessage> messages) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("course_code", "INT1001");
        values.put("section_code", "01");
        values.put("class_name", "D23CQCN01");
        values.put("lecturer_code", "GV01");
        values.put("enrolled_count", "40");
        values.put("max_capacity", "50");
        values.put("day_of_week", "MON");
        values.put("slot_start_no", "1");
        values.put("slot_end_no", "3");
        values.put("from_week_no", "1");
        values.put("to_week_no", "15");
        values.put("session_type", "THEORY");
        values.put("practice_group_no", "0");
        values.put("preferred_classroom_code", "");
        return new ImportPreviewRow(2, "HK1", "INT1001", "01", "D23CQCN01", "GV01",
                "MON 1-3, tuần 1-15", "", status, operation, messages, values);
    }

    private ReferenceData referenceData(boolean existing) {
        CourseRef course = new CourseRef(10L, "INT1001", "LECTURE");
        LecturerRef lecturer = new LecturerRef(20L, "GV01");
        SectionRef section = new SectionRef(40L, 10L, 20L, "01", "D23CQCN01", 40, 50, "ACTIVE");
        ScheduleRef schedule = new ScheduleRef(50L, 40L, 30L, "MON", 1, 3, 1, 15, "THEORY", 0, "ASSIGNED");
        return new ReferenceData(
                Map.of("INT1001", course),
                Map.of("GV01", lecturer),
                Map.of(
                        1, new SlotRef(1L, 1, LocalTime.of(7, 0), LocalTime.of(7, 50)),
                        3, new SlotRef(3L, 3, LocalTime.of(8, 50), LocalTime.of(9, 40))
                ),
                Map.of(), Map.of(), new WeekRange(1, 15),
                existing ? List.of(section) : List.of(),
                existing ? List.of(schedule) : List.of()
        );
    }

    private static class FakeWriteStore implements TimetableImportWriteStore {
        private final String semesterStatus;
        private boolean lockCalled;
        private boolean draftMarked;
        private ScheduleWrite lastSchedule;

        private FakeWriteStore(String semesterStatus) {
            this.semesterStatus = semesterStatus;
        }

        @Override
        public Optional<SemesterRef> lockSemester(long semesterId) {
            lockCalled = true;
            return Optional.of(new SemesterRef(semesterId, "HK1", semesterStatus));
        }

        @Override public long insertSection(SectionWrite row) { return 40L; }
        @Override public void updateSection(long sectionId, SectionWrite row) { }
        @Override public long insertSchedule(ScheduleWrite row) { lastSchedule = row; return 50L; }
        @Override public void updateSchedule(long scheduleId, ScheduleWrite row) { lastSchedule = row; }
        @Override public void markSemesterDraft(long semesterId) { draftMarked = true; }
    }
}
