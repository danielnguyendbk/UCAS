package com.ptit.qlphonghoc.admin.timetableimport.service;

import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewResponse;
import com.ptit.qlphonghoc.admin.timetableimport.parser.ParsedImportFile;
import com.ptit.qlphonghoc.admin.timetableimport.parser.TimetableImportFileParser;
import com.ptit.qlphonghoc.admin.timetableimport.parser.TimetableImportParser;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportDataSource;
import com.ptit.qlphonghoc.admin.timetableimport.repository.TimetableImportReadRepository.*;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TimetableImportPreviewServiceTest {

    private final MockMultipartFile file = new MockMultipartFile("file", "preview.csv", "text/csv", new byte[]{1});

    @Test
    void previewsValidNewSectionWithoutWriting() {
        TimetableImportPreviewService service = serviceFor(validRow("INT1001"), "DRAFT");

        ImportPreviewResponse result = service.preview(file, 1L, null);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.validRows()).isEqualTo(1);
        assertThat(result.rows().get(0).operation()).isEqualTo("CREATE_SECTION");
    }

    @Test
    void reportsMissingCourseAtRowLevel() {
        TimetableImportParser parser = ignored -> new ParsedImportFile(List.of(validRow("MISSING")), List.of(7));
        TimetableImportPreviewService service = new TimetableImportPreviewService(parser, dataSource("DRAFT"));

        ImportPreviewResponse result = service.preview(file, 1L, null);

        assertThat(result.errorRows()).isEqualTo(1);
        assertThat(result.rows().get(0).rowNumber()).isEqualTo(7);
        assertThat(result.rows().get(0).messages()).extracting("code").contains("COURSE_NOT_FOUND");
    }

    @Test
    void rejectsPublishedSemesterBeforeLoadingReferenceData() {
        TimetableImportPreviewService service = serviceFor(validRow("INT1001"), "PUBLISHED");

        assertThatThrownBy(() -> service.preview(file, 1L, null))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode")
                .isEqualTo("TIMETABLE_ALREADY_PUBLISHED");
    }

    private TimetableImportPreviewService serviceFor(Map<String, String> row, String status) {
        TimetableImportParser parser = ignored -> new ParsedImportFile(List.of(row), List.of(2));
        return new TimetableImportPreviewService(parser, dataSource(status));
    }

    private TimetableImportDataSource dataSource(String status) {
        return new TimetableImportDataSource() {
            @Override
            public Optional<SemesterRef> findSemester(Long semesterId, String semesterCode) {
                return Optional.of(new SemesterRef(1L, "HK1", status));
            }

            @Override
            public ReferenceData loadReferenceData(long semesterId) {
                return referenceData();
            }
        };
    }

    private ReferenceData referenceData() {
        return new ReferenceData(
                Map.of("INT1001", new CourseRef(10L, "INT1001", "LECTURE")),
                Map.of("GV01", new LecturerRef(20L, "GV01")),
                Map.of(
                        1, new SlotRef(1L, 1, LocalTime.of(7, 0), LocalTime.of(7, 50)),
                        3, new SlotRef(3L, 3, LocalTime.of(8, 50), LocalTime.of(9, 40))
                ),
                Map.of(), Map.of(), new WeekRange(1, 15), List.of(), List.of()
        );
    }

    private Map<String, String> validRow(String courseCode) {
        Map<String, String> row = new LinkedHashMap<>();
        TimetableImportFileParser.HEADERS.forEach(header -> row.put(header, ""));
        row.put("semester_code", "HK1");
        row.put("course_code", courseCode);
        row.put("section_code", "01");
        row.put("class_name", "D23CQCN01");
        row.put("lecturer_code", "GV01");
        row.put("enrolled_count", "40");
        row.put("max_capacity", "50");
        row.put("day_of_week", "MON");
        row.put("slot_start_no", "1");
        row.put("slot_end_no", "3");
        row.put("from_week_no", "1");
        row.put("to_week_no", "15");
        row.put("session_type", "THEORY");
        row.put("practice_group_no", "0");
        return row;
    }
}
