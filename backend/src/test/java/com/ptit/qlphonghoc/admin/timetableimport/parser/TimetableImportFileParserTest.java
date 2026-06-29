package com.ptit.qlphonghoc.admin.timetableimport.parser;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TimetableImportFileParserTest {

    private final TimetableImportFileParser parser = new TimetableImportFileParser();

    @Test
    void parsesCsvWithQuotedValues() {
        String csv = String.join(",", TimetableImportFileParser.HEADERS) + "\n"
                + "HK1,INT1234,01,\"D23,CQCN01\",GV01,40,50,MON,1,3,1,15,THEORY,0,LECTURE,A,A-101";
        MockMultipartFile file = new MockMultipartFile("file", "preview.csv", "text/csv",
                csv.getBytes(StandardCharsets.UTF_8));

        ParsedImportFile result = parser.parse(file);

        assertThat(result.rows()).hasSize(1);
        assertThat(result.rows().get(0).get("class_name")).isEqualTo("D23,CQCN01");
        assertThat(result.rowNumbers()).containsExactly(2);
    }

    @Test
    void parsesXlsxAndSkipsBlankRows() throws Exception {
        byte[] bytes;
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet();
            var header = sheet.createRow(0);
            for (int index = 0; index < TimetableImportFileParser.HEADERS.size(); index++) {
                header.createCell(index).setCellValue(TimetableImportFileParser.HEADERS.get(index));
            }
            var row = sheet.createRow(2);
            row.createCell(0).setCellValue("HK1");
            row.createCell(1).setCellValue("INT1234");
            workbook.write(output);
            bytes = output.toByteArray();
        }

        ParsedImportFile result = parser.parse(new MockMultipartFile("file", "preview.xlsx", null, bytes));

        assertThat(result.rows()).hasSize(1);
        assertThat(result.rowNumbers()).containsExactly(3);
    }

    @Test
    void rejectsMissingRequiredHeader() {
        MockMultipartFile file = new MockMultipartFile("file", "preview.csv", "text/csv",
                "semester_code,course_code\nHK1,INT1234".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> parser.parse(file))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode")
                .isEqualTo("IMPORT_PARSE_ERROR");
    }

    @Test
    void rejectsUnsupportedFileType() {
        MockMultipartFile file = new MockMultipartFile("file", "preview.xls", null, new byte[]{1});
        assertThatThrownBy(() -> parser.parse(file))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode")
                .isEqualTo("IMPORT_FILE_INVALID_TYPE");
    }
}
