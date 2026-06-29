package com.ptit.qlphonghoc.admin.examimport.controller;

import com.ptit.qlphonghoc.admin.examimport.dto.ExamImportApplyResponse;
import com.ptit.qlphonghoc.admin.examimport.dto.ExamImportPreviewResponse;
import com.ptit.qlphonghoc.admin.examimport.service.ExamImportService;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
@RequestMapping("/api/admin/exam-import")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamImportController {

    private final ExamImportService importService;

    public AdminExamImportController(ExamImportService importService) {
        this.importService = importService;
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("exam_import");
            Row header = sheet.createRow(0);
            for (int i = 0; i < ExamImportService.HEADERS.size(); i++) {
                header.createCell(i).setCellValue(ExamImportService.HEADERS.get(i));
                sheet.setColumnWidth(i, 22 * 256);
            }
            List<String> sample = List.of(
                    "INT1234.01", "2025-07-15", "08:00", "10:00",
                    "A-101", "GV001", "GV002", "FINAL", "WRITTEN", "Thi cuối kỳ"
            );
            Row sampleRow = sheet.createRow(1);
            for (int i = 0; i < sample.size(); i++) sampleRow.createCell(i).setCellValue(sample.get(i));

            workbook.write(out);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("ucas-exam-import-template.xlsx", StandardCharsets.UTF_8).build());
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            return ResponseEntity.ok().headers(headers).body(out.toByteArray());
        }
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ExamImportPreviewResponse> preview(
            @RequestParam MultipartFile file,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "MERGE") String importMode
    ) {
        return ApiResponse.success(
                "Kiểm tra file xong. Chưa có dữ liệu nào được ghi.",
                importService.preview(file, semesterId, importMode)
        );
    }

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ExamImportApplyResponse> apply(
            @RequestParam MultipartFile file,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "MERGE") String importMode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ApiResponse.success(
                "Đã áp dụng file import lịch thi.",
                importService.apply(file, semesterId, userDetails.getUserId(), importMode)
        );
    }
}
