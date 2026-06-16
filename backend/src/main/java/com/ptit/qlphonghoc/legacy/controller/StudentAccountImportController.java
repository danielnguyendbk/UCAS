package com.ptit.qlphonghoc.legacy.controller;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

@RestController
@RequestMapping("/api/admin/users")
public class StudentAccountImportController {
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public StudentAccountImportController(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/import-students/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("students");
            Row header = sheet.createRow(0);
            List<String> headers = List.of("username", "password", "email", "full_name", "student_code", "department_id", "class_name", "course_year", "phone", "status");
            for (int i = 0; i < headers.size(); i++) {
                header.createCell(i).setCellValue(headers.get(i));
                sheet.setColumnWidth(i, 5000);
            }
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("B21DCCN001");
            sample.createCell(1).setCellValue("123456");
            sample.createCell(2).setCellValue("b21dccn001@student.ptit.edu.vn");
            sample.createCell(3).setCellValue("Nguyen Van A");
            sample.createCell(4).setCellValue("B21DCCN001");
            sample.createCell(5).setCellValue(1);
            sample.createCell(6).setCellValue("D21CQCN01-B");
            sample.createCell(7).setCellValue(2021);
            sample.createCell(8).setCellValue("0900000000");
            sample.createCell(9).setCellValue("ACTIVE");

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            responseHeaders.setContentDisposition(ContentDisposition.attachment().filename("student_import_template.xlsx").build());
            return ResponseEntity.ok().headers(responseHeaders).body(out.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().contentType(MediaType.TEXT_PLAIN).body(("Cannot create template: " + e.getMessage()).getBytes());
        }
    }

    @PostMapping(value = "/import-students", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Map<String, Object>> importStudents(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(response(false, "File import không hợp lệ.", null));
        }

        List<Map<String, Object>> imported = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
                return ResponseEntity.badRequest().body(response(false, "File không có dữ liệu sinh viên.", null));
            }

            DataFormatter formatter = new DataFormatter();
            Map<String, Integer> headerMap = readHeader(sheet.getRow(0), formatter);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isBlankRow(row, formatter)) continue;
                StudentRow input = parseRow(row, headerMap, formatter);
                List<String> rowErrors = validate(input);
                if (!rowErrors.isEmpty()) {
                    errors.add(errorItem(i + 1, rowErrors));
                    continue;
                }
                try {
                    Integer userId = insertOne(input);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("row", i + 1);
                    item.put("userId", userId);
                    item.put("username", input.username);
                    item.put("studentCode", input.studentCode);
                    imported.add(item);
                } catch (Exception ex) {
                    errors.add(errorItem(i + 1, List.of(ex.getMessage())));
                }
            }
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(response(false, "Không đọc được file import.", ex.getMessage()));
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("importedCount", imported.size());
        data.put("errorCount", errors.size());
        data.put("imported", imported);
        data.put("errors", errors);

        boolean success = errors.isEmpty();
        return ResponseEntity.ok(response(success, success ? "Import sinh viên thành công." : "Import hoàn tất nhưng có dòng lỗi.", data));
    }

    private Integer insertOne(StudentRow input) {
        if (existsPlain("users", "username", input.username)) throw new IllegalArgumentException("Username đã tồn tại: " + input.username);
        if (existsPlain("users", "email", input.email)) throw new IllegalArgumentException("Email đã tồn tại: " + input.email);
        if (existsActive("students", "student_code", input.studentCode)) throw new IllegalArgumentException("Mã sinh viên đã tồn tại: " + input.studentCode);
        if (!existsDepartment(input.departmentId)) throw new IllegalArgumentException("department_id không tồn tại: " + input.departmentId);

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                            INSERT INTO users
                                (username, password_hash, email, force_password_change, role, status)
                            VALUES
                                (?, ?, ?, TRUE, 'STUDENT', ?)
                            """,
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, input.username);
            ps.setString(2, passwordEncoder.encode(input.password.isBlank() ? "123456" : input.password));
            ps.setString(3, input.email);
            ps.setString(4, input.status.isBlank() ? "ACTIVE" : input.status);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Không lấy được user_id.");
        Integer userId = key.intValue();

        jdbcTemplate.update(
                """
                        INSERT INTO students
                            (user_id, department_id, student_code, class_name, course_year, phone, is_deleted)
                        VALUES (?, ?, ?, ?, ?, ?, 0)
                        """,
                userId, input.departmentId, input.studentCode, input.className, input.courseYear, blankToNull(input.phone));
        return userId;
    }

    private List<String> validate(StudentRow input) {
        List<String> errors = new ArrayList<>();
        if (input.username.isBlank()) errors.add("username không được để trống");
        if (input.password.isBlank()) input.password = "123456";
        if (input.password.length() < 6) errors.add("password phải có ít nhất 6 ký tự");
        if (input.email.isBlank() || !input.email.contains("@")) errors.add("email không hợp lệ");
        if (input.studentCode.isBlank()) errors.add("student_code không được để trống");
        if (input.departmentId == null) errors.add("department_id/faculty_id phải là số và không được để trống");
        if (input.className.isBlank()) errors.add("class_name không được để trống");
        if (input.status.isBlank()) input.status = "ACTIVE";
        input.status = statusValue(input.status);
        return errors;
    }

    private StudentRow parseRow(Row row, Map<String, Integer> headerMap, DataFormatter formatter) {
        StudentRow input = new StudentRow();
        input.username = cell(row, headerMap, formatter, "username");
        input.password = cell(row, headerMap, formatter, "password");
        input.email = cell(row, headerMap, formatter, "email");
        input.fullName = cell(row, headerMap, formatter, "full_name", "fullName", "name");
        input.studentCode = cell(row, headerMap, formatter, "student_code", "studentCode");
        String department = cell(row, headerMap, formatter, "department_id", "departmentId", "faculty_id", "facultyId");
        input.departmentId = integerValue(department);
        input.className = cell(row, headerMap, formatter, "class_name", "className");
        input.courseYear = integerValue(cell(row, headerMap, formatter, "course_year", "courseYear"));
        input.phone = cell(row, headerMap, formatter, "phone");
        input.status = cell(row, headerMap, formatter, "status", "is_active", "isActive");
        return input;
    }

    private Map<String, Integer> readHeader(Row header, DataFormatter formatter) {
        Map<String, Integer> map = new HashMap<>();
        if (header == null) return map;
        for (Cell cell : header) {
            String text = formatter.formatCellValue(cell).trim();
            if (!text.isBlank()) map.put(text, cell.getColumnIndex());
        }
        return map;
    }

    private String cell(Row row, Map<String, Integer> headerMap, DataFormatter formatter, String... keys) {
        for (String key : keys) {
            Integer index = headerMap.get(key);
            if (index != null) return formatter.formatCellValue(row.getCell(index)).trim();
        }
        return "";
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (Cell cell : row) if (!formatter.formatCellValue(cell).trim().isBlank()) return false;
        return true;
    }

    private Map<String, Object> errorItem(int row, List<String> rowErrors) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("row", row);
        item.put("errors", rowErrors);
        return item;
    }

    private boolean existsPlain(String tableName, String columnName, String value) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " = ?", Integer.class, value);
        return count != null && count > 0;
    }

    private boolean existsActive(String tableName, String columnName, String value) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableName + " WHERE " + columnName + " = ? AND is_deleted = 0", Integer.class, value);
        return count != null && count > 0;
    }

    private boolean existsDepartment(Integer id) {
        if (id == null) return false;
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM departments WHERE department_id = ? AND is_deleted = 0", Integer.class, id);
        return count != null && count > 0;
    }

    private Integer integerValue(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isBlank()) return null;
        try { return Integer.parseInt(text); } catch (NumberFormatException ex) { return null; }
    }

    private String statusValue(String value) {
        String text = value == null ? "" : value.trim();
        if (text.isBlank()) return "ACTIVE";
        if ("1".equals(text) || "true".equalsIgnoreCase(text)) return "ACTIVE";
        if ("0".equals(text) || "false".equalsIgnoreCase(text)) return "INACTIVE";
        return text.toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }

    private Map<String, Object> response(boolean success, String message, Object data) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", success);
        res.put("message", message);
        res.put("data", data);
        return res;
    }

    private static class StudentRow {
        String username = "";
        String password = "";
        String email = "";
        String fullName = "";
        String studentCode = "";
        Integer departmentId;
        String className = "";
        Integer courseYear;
        String phone = "";
        String status = "";
    }
}
