package com.ucas.qlphonghoc.controller;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

@RestController
@RequestMapping("/api/admin/users")
public class StudentAccountImportController {

    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;

    public StudentAccountImportController(
            JdbcTemplate jdbcTemplate,
            PlatformTransactionManager transactionManager) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @GetMapping("/import-students/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("students");

            String[] headers = {
                    "username",
                    "password",
                    "email",
                    "full_name",
                    "student_code",
                    "faculty_id",
                    "class_name",
                    "course_year",
                    "phone",
                    "is_active"
            };

            Row headerRow = sheet.createRow(0);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Object[][] samples = {
                    { "sv24001", "123456", "sv24001@ucas.local", "Nguyễn Văn Sinh", "SV24001", 1, "D23CQCN01-B", 2024,
                            "0900000001", 1 },
                    { "sv24002", "123456", "sv24002@ucas.local", "Trần Thị Học", "SV24002", 1, "D23CQCN01-B", 2024,
                            "0900000002", 1 },
                    { "sv24003", "123456", "sv24003@ucas.local", "Lê Quốc Viên", "SV24003", 2, "D23CQAT01-B", 2024,
                            "0900000003", 1 }
            };

            for (int r = 0; r < samples.length; r++) {
                Row row = sheet.createRow(r + 1);

                for (int c = 0; c < samples[r].length; c++) {
                    Object value = samples[r][c];
                    Cell cell = row.createCell(c);

                    if (value instanceof Number number) {
                        cell.setCellValue(number.doubleValue());
                    } else {
                        cell.setCellValue(String.valueOf(value));
                    }
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);

            HttpHeaders headersResponse = new HttpHeaders();
            headersResponse.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headersResponse.setContentDisposition(
                    ContentDisposition.attachment()
                            .filename("student_import_template.xlsx", StandardCharsets.UTF_8)
                            .build());

            return ResponseEntity
                    .ok()
                    .headers(headersResponse)
                    .body(outputStream.toByteArray());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("Cannot create student import template: " + ex.getMessage())
                            .getBytes(StandardCharsets.UTF_8));
        }
    }

    @PostMapping(value = "/import-students", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importStudents(
            @RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    response(false, "Vui lòng chọn file Excel để import sinh viên.", null));
        }

        int totalRows = 0;
        int successCount = 0;

        List<Map<String, Object>> errors = new ArrayList<>();

        Set<String> usernamesInFile = new HashSet<>();
        Set<String> emailsInFile = new HashSet<>();
        Set<String> studentCodesInFile = new HashSet<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            if (sheet == null || sheet.getLastRowNum() < 1) {
                return ResponseEntity.badRequest().body(
                        response(false, "File Excel không có dữ liệu sinh viên.", null));
            }

            Map<String, Integer> headerMap = readHeaderMap(sheet.getRow(0));

            List<String> requiredColumns = List.of(
                    "username",
                    "email",
                    "full_name",
                    "student_code",
                    "faculty_id",
                    "class_name");

            for (String column : requiredColumns) {
                if (!headerMap.containsKey(column)) {
                    return ResponseEntity.badRequest().body(
                            response(false, "File Excel thiếu cột bắt buộc: " + column, null));
                }
            }

            DataFormatter formatter = new DataFormatter();

            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);

                if (row == null || isBlankRow(row, formatter)) {
                    continue;
                }

                totalRows++;
                int excelRowNumber = rowIndex + 1;

                StudentImportRow input = readStudentRow(row, headerMap, formatter);
                List<String> rowErrors = validateRow(
                        input,
                        usernamesInFile,
                        emailsInFile,
                        studentCodesInFile);

                if (!rowErrors.isEmpty()) {
                    errors.add(errorRow(excelRowNumber, input.username, String.join("; ", rowErrors)));
                    continue;
                }

                try {
                    transactionTemplate.executeWithoutResult(status -> {
                        Integer userId = insertStudentUser(input);
                        insertStudentProfile(userId, input);
                    });

                    successCount++;
                } catch (Exception ex) {
                    errors.add(errorRow(excelRowNumber, input.username, ex.getMessage()));
                }
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("totalRows", totalRows);
            data.put("successCount", successCount);
            data.put("failedCount", errors.size());
            data.put("errors", errors);

            return ResponseEntity.ok(
                    response(true, "Import sinh viên hoàn tất.", data));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(
                    response(false, "Không import được file Excel.", ex.getMessage()));
        }
    }

    private StudentImportRow readStudentRow(
            Row row,
            Map<String, Integer> headerMap,
            DataFormatter formatter) {
        StudentImportRow input = new StudentImportRow();

        input.username = cell(row, headerMap, "username", formatter);
        input.password = cell(row, headerMap, "password", formatter);
        input.email = cell(row, headerMap, "email", formatter);
        input.fullName = cell(row, headerMap, "full_name", formatter);
        input.studentCode = cell(row, headerMap, "student_code", formatter);
        input.facultyIdText = cell(row, headerMap, "faculty_id", formatter);
        input.className = cell(row, headerMap, "class_name", formatter);
        input.courseYearText = cell(row, headerMap, "course_year", formatter);
        input.phone = cell(row, headerMap, "phone", formatter);
        input.isActiveText = cell(row, headerMap, "is_active", formatter);

        if (input.password.isBlank()) {
            input.password = "123456";
        }

        input.facultyId = parseInteger(input.facultyIdText);
        input.courseYear = parseInteger(input.courseYearText);
        input.isActive = parseActiveFlag(input.isActiveText);

        return input;
    }

    private List<String> validateRow(
            StudentImportRow input,
            Set<String> usernamesInFile,
            Set<String> emailsInFile,
            Set<String> studentCodesInFile) {
        List<String> errors = new ArrayList<>();

        if (input.username.isBlank()) {
            errors.add("username không được để trống");
        }

        if (input.password.isBlank() || input.password.length() < 6) {
            errors.add("password phải có ít nhất 6 ký tự");
        }

        if (input.email.isBlank()) {
            errors.add("email không được để trống");
        } else if (!input.email.contains("@")) {
            errors.add("email không hợp lệ");
        }

        if (input.fullName.isBlank()) {
            errors.add("full_name không được để trống");
        }

        if (input.studentCode.isBlank()) {
            errors.add("student_code không được để trống");
        }

        if (input.facultyId == null) {
            errors.add("faculty_id phải là số và không được để trống");
        }

        if (input.className.isBlank()) {
            errors.add("class_name không được để trống. Sinh viên bắt buộc phải thuộc một lớp");
        }

        String usernameKey = input.username.toLowerCase(Locale.ROOT);
        String emailKey = input.email.toLowerCase(Locale.ROOT);
        String studentCodeKey = input.studentCode.toLowerCase(Locale.ROOT);

        if (!input.username.isBlank() && !usernamesInFile.add(usernameKey)) {
            errors.add("username bị trùng trong file: " + input.username);
        }

        if (!input.email.isBlank() && !emailsInFile.add(emailKey)) {
            errors.add("email bị trùng trong file: " + input.email);
        }

        if (!input.studentCode.isBlank() && !studentCodesInFile.add(studentCodeKey)) {
            errors.add("student_code bị trùng trong file: " + input.studentCode);
        }

        if (!input.username.isBlank() && exists("users", "username", input.username)) {
            errors.add("username đã tồn tại trong hệ thống: " + input.username);
        }

        if (!input.email.isBlank() && exists("users", "email", input.email)) {
            errors.add("email đã tồn tại trong hệ thống: " + input.email);
        }

        if (!input.studentCode.isBlank() && exists("students", "student_code", input.studentCode)) {
            errors.add("student_code đã tồn tại trong hệ thống: " + input.studentCode);
        }

        if (input.facultyId != null && !existsById("faculties", input.facultyId)) {
            errors.add("faculty_id không tồn tại: " + input.facultyId);
        }

        return errors;
    }

    private Integer insertStudentUser(StudentImportRow input) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                            INSERT INTO users
                                (username, email, password_hash, full_name, role, is_active, is_deleted)
                            VALUES
                                (?, ?, ?, ?, 'STUDENT', ?, 0)
                            """,
                    Statement.RETURN_GENERATED_KEYS);

            ps.setString(1, input.username);
            ps.setString(2, input.email);
            ps.setString(3, input.password);
            ps.setString(4, input.fullName);
            ps.setInt(5, input.isActive);

            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();

        if (key == null) {
            throw new IllegalStateException("Không lấy được user_id sau khi tạo tài khoản sinh viên.");
        }

        return key.intValue();
    }

    private void insertStudentProfile(Integer userId, StudentImportRow input) {
        jdbcTemplate.update(
                """
                        INSERT INTO students
                            (user_id, faculty_id, student_code, class_name, course_year, phone, is_deleted)
                        VALUES
                            (?, ?, ?, ?, ?, ?, 0)
                        """,
                userId,
                input.facultyId,
                input.studentCode,
                input.className,
                input.courseYear,
                input.phone.isBlank() ? null : input.phone);
    }

    private Map<String, Integer> readHeaderMap(Row headerRow) {
        Map<String, Integer> headerMap = new HashMap<>();
        DataFormatter formatter = new DataFormatter();

        if (headerRow == null) {
            return headerMap;
        }

        for (Cell cell : headerRow) {
            String header = formatter.formatCellValue(cell)
                    .trim()
                    .toLowerCase(Locale.ROOT);

            if (!header.isBlank()) {
                headerMap.put(header, cell.getColumnIndex());
            }
        }

        return headerMap;
    }

    private String cell(
            Row row,
            Map<String, Integer> headerMap,
            String columnName,
            DataFormatter formatter) {
        Integer columnIndex = headerMap.get(columnName);

        if (columnIndex == null) {
            return "";
        }

        Cell cell = row.getCell(columnIndex);

        if (cell == null) {
            return "";
        }

        return formatter.formatCellValue(cell).trim();
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (Cell cell : row) {
            if (!formatter.formatCellValue(cell).trim().isBlank()) {
                return false;
            }
        }

        return true;
    }

    private Integer parseInteger(String value) {
        if (value == null || value.trim().isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private int parseActiveFlag(String value) {
        if (value == null || value.trim().isBlank()) {
            return 1;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);

        if ("0".equals(normalized)
                || "false".equals(normalized)
                || "inactive".equals(normalized)
                || "locked".equals(normalized)
                || "khoa".equals(normalized)
                || "khóa".equals(normalized)
                || "da khoa".equals(normalized)
                || "đã khóa".equals(normalized)) {
            return 0;
        }

        return 1;
    }

    private boolean exists(String tableName, String columnName, String value) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " = ? AND is_deleted = 0",
                Integer.class,
                value);

        return count != null && count > 0;
    }

    private boolean existsById(String tableName, Integer id) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE id = ? AND is_deleted = 0",
                Integer.class,
                id);

        return count != null && count > 0;
    }

    private Map<String, Object> errorRow(int rowNumber, String username, String message) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("row", rowNumber);
        error.put("username", username);
        error.put("message", message);
        return error;
    }

    private Map<String, Object> response(boolean success, String message, Object data) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", success);
        res.put("message", message);
        res.put("data", data);
        return res;
    }

    private static class StudentImportRow {
        String username = "";
        String password = "";
        String email = "";
        String fullName = "";
        String studentCode = "";
        String facultyIdText = "";
        Integer facultyId;
        String className = "";
        String courseYearText = "";
        Integer courseYear;
        String phone = "";
        String isActiveText = "";
        int isActive = 1;
    }
}