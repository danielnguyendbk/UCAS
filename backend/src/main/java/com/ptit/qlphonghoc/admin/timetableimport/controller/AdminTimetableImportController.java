package com.ptit.qlphonghoc.admin.timetableimport.controller;

import com.ptit.qlphonghoc.admin.timetableimport.dto.ImportPreviewResponse;
import com.ptit.qlphonghoc.admin.timetableimport.parser.TimetableImportFileParser;
import com.ptit.qlphonghoc.admin.timetableimport.service.TimetableImportPreviewService;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/timetable-import")
public class AdminTimetableImportController {

    private final TimetableImportPreviewService previewService;

    public AdminTimetableImportController(TimetableImportPreviewService previewService) {
        this.previewService = previewService;
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ImportPreviewResponse> preview(
            @RequestParam(required = false) MultipartFile file,
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) String semesterCode
    ) {
        return ApiResponse.success("Đã kiểm tra file import. Chưa có dữ liệu nào được ghi.",
                previewService.preview(file, semesterId, semesterCode));
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("timetable_import");
            Row header = sheet.createRow(0);
            for (int index = 0; index < TimetableImportFileParser.HEADERS.size(); index++) {
                header.createCell(index).setCellValue(TimetableImportFileParser.HEADERS.get(index));
                sheet.setColumnWidth(index, 22 * 256);
            }
            List<String> sample = List.of(
                    "2025-2026-1", "INT1234", "01", "D23CQCN01-B", "GV001", "40", "50",
                    "MON", "1", "3", "1", "15", "THEORY", "0", "LECTURE", "A", "A-101"
            );
            Row sampleRow = sheet.createRow(1);
            for (int index = 0; index < sample.size(); index++) sampleRow.createCell(index).setCellValue(sample.get(index));
            workbook.write(output);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("ucas-timetable-import-template.xlsx", StandardCharsets.UTF_8).build());
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            return ResponseEntity.ok().headers(headers).body(output.toByteArray());
        }
    }
}
