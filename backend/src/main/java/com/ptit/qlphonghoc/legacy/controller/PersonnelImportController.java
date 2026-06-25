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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

@RestController
public class PersonnelImportController {
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public PersonnelImportController(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping({"/lecturers/import-template", "/api/lecturers/import-template"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadLecturerTemplate() {
        List<String> headers = List.of("username", "password", "email", "lecturer_code", "full_name", "department_id", "phone", "status");
        List<Object> sample = List.of("gv001", "123456", "gv001@ucas.local", "GV001", "Giảng viên Test", 1, "0900000001", "ACTIVE");
        return workbookResponse("lecturer_import_template.xlsx", "lecturers", headers, sample);
    }

    @PostMapping(value = {"/lecturers/import", "/api/lecturers/import"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> importLecturers(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(response(false, "File import không hợp lệ.", null));
        }

        List<Map<String, Object>> imported = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
                return ResponseEntity.badRequest().body(response(false, "File không có dữ liệu giảng viên.", null));
            }

            DataFormatter formatter = new DataFormatter();
            Map<String, Integer> headerMap = readHeader(sheet.getRow(0), formatter);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isBlankRow(row, formatter)) continue;

                LecturerRow input = parseLecturerRow(row, headerMap, formatter);
                List<String> rowErrors = validateLecturer(input);
                if (!rowErrors.isEmpty()) {
                    errors.add(errorItem(i + 1, rowErrors));
                    continue;
                }

                try {
                    Number userId = insertLecturer(input);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("row", i + 1);
                    item.put("userId", userId);
                    item.put("username", input.username);
                    item.put("lecturerCode", input.lecturerCode);
                    imported.add(item);
                } catch (Exception ex) {
                    errors.add(errorItem(i + 1, List.of(cleanError(ex))));
                }
            }
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(response(false, "Không đọc được file import giảng viên.", cleanError(ex)));
        }

        Map<String, Object> data = resultData(imported, errors);
        boolean success = errors.isEmpty();
        return ResponseEntity.ok(response(success, success ? "Import giảng viên thành công." : "Import giảng viên hoàn tất nhưng có dòng lỗi.", data));
    }

    @GetMapping({"/facility-staff/import-template", "/api/facility-staff/import-template"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadFacilityStaffTemplate() {
        List<String> headers = List.of("username", "password", "email", "staff_code", "building_id", "note", "status");
        List<Object> sample = List.of("csvc001", "123456", "csvc001@ucas.local", "CSVC001", 1, "Nhân viên cơ sở vật chất test", "ACTIVE");
        return workbookResponse("facility_staff_import_template.xlsx", "facility_staff", headers, sample);
    }

    @PostMapping(value = {"/facility-staff/import", "/api/facility-staff/import"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> importFacilityStaff(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(response(false, "File import không hợp lệ.", null));
        }

        List<Map<String, Object>> imported = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
                return ResponseEntity.badRequest().body(response(false, "File không có dữ liệu nhân viên cơ sở vật chất.", null));
            }

            DataFormatter formatter = new DataFormatter();
            Map<String, Integer> headerMap = readHeader(sheet.getRow(0), formatter);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isBlankRow(row, formatter)) continue;

                FacilityStaffRow input = parseFacilityStaffRow(row, headerMap, formatter);
                List<String> rowErrors = validateFacilityStaff(input);
                if (!rowErrors.isEmpty()) {
                    errors.add(errorItem(i + 1, rowErrors));
                    continue;
                }

                try {
                    Number userId = insertFacilityStaff(input);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("row", i + 1);
                    item.put("userId", userId);
                    item.put("username", input.username);
                    item.put("staffCode", input.staffCode);
                    imported.add(item);
                } catch (Exception ex) {
                    errors.add(errorItem(i + 1, List.of(cleanError(ex))));
                }
            }
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(response(false, "Không đọc được file import nhân viên cơ sở vật chất.", cleanError(ex)));
        }

        Map<String, Object> data = resultData(imported, errors);
        boolean success = errors.isEmpty();
        return ResponseEntity.ok(response(success, success ? "Import nhân viên cơ sở vật chất thành công." : "Import nhân viên cơ sở vật chất hoàn tất nhưng có dòng lỗi.", data));
    }

    private Number insertLecturer(LecturerRow input) {
        if (existsPlain("users", "username", input.username)) throw new IllegalArgumentException("Username đã tồn tại: " + input.username);
        if (existsPlain("users", "email", input.email)) throw new IllegalArgumentException("Email đã tồn tại: " + input.email);
        if (existsActive("lecturers", "lecturer_code", input.lecturerCode)) throw new IllegalArgumentException("Mã giảng viên đã tồn tại: " + input.lecturerCode);
        if (existsActive("lecturers", "email", input.email)) throw new IllegalArgumentException("Email giảng viên đã tồn tại: " + input.email);
        if (!existsDepartment(input.departmentId)) throw new IllegalArgumentException("department_id không tồn tại: " + input.departmentId);

        Number userId = insertUser(input.username, input.password, input.email, "LECTURER", input.status);
        try {
            jdbcTemplate.update(
                    """
                            INSERT INTO lecturers
                                (user_id, department_id, lecturer_code, full_name, email, phone, is_deleted)
                            VALUES (?, ?, ?, ?, ?, ?, 0)
                            """,
                    userId, input.departmentId, input.lecturerCode, input.fullName, input.email, blankToNull(input.phone));
            return userId;
        } catch (RuntimeException ex) {
            cleanupUser(userId);
            throw ex;
        }
    }

    private Number insertFacilityStaff(FacilityStaffRow input) {
        if (existsPlain("users", "username", input.username)) throw new IllegalArgumentException("Username đã tồn tại: " + input.username);
        if (existsPlain("users", "email", input.email)) throw new IllegalArgumentException("Email đã tồn tại: " + input.email);
        if (existsActive("facility_staff", "staff_code", input.staffCode)) throw new IllegalArgumentException("Mã nhân viên đã tồn tại: " + input.staffCode);
        if (input.buildingId != null && !existsBuilding(input.buildingId)) throw new IllegalArgumentException("building_id không tồn tại: " + input.buildingId);

        Number userId = insertUser(input.username, input.password, input.email, "FACILITY", input.status);
        try {
            jdbcTemplate.update(
                    """
                            INSERT INTO facility_staff
                                (user_id, staff_code, building_id, note, is_deleted)
                            VALUES (?, ?, ?, ?, 0)
                            """,
                    userId, input.staffCode, input.buildingId, blankToNull(input.note));
            return userId;
        } catch (RuntimeException ex) {
            cleanupUser(userId);
            throw ex;
        }
    }

    private Number insertUser(String username, String password, String email, String role, String status) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                    """
                            INSERT INTO users
                                (username, password_hash, email, force_password_change, role, status)
                            VALUES
                                (?, ?, ?, TRUE, ?, ?)
                            """,
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, username);
            ps.setString(2, passwordEncoder.encode(password.isBlank() ? "123456" : password));
            ps.setString(3, email);
            ps.setString(4, role);
            ps.setString(5, status.isBlank() ? "ACTIVE" : status);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Không lấy được user_id.");
        return key;
    }

    private List<String> validateLecturer(LecturerRow input) {
        List<String> errors = validateBaseUser(input.username, input.password, input.email, input.status);
        if (input.lecturerCode.isBlank()) errors.add("lecturer_code không được để trống");
        if (input.fullName.isBlank()) errors.add("full_name không được để trống");
        if (input.departmentId == null) errors.add("department_id phải là số và không được để trống");
        input.status = statusValue(input.status);
        if (input.password.isBlank()) input.password = "123456";
        return errors;
    }

    private List<String> validateFacilityStaff(FacilityStaffRow input) {
        List<String> errors = validateBaseUser(input.username, input.password, input.email, input.status);
        if (input.staffCode.isBlank()) errors.add("staff_code không được để trống");
        input.status = statusValue(input.status);
        if (input.password.isBlank()) input.password = "123456";
        return errors;
    }

    private List<String> validateBaseUser(String username, String password, String email, String status) {
        List<String> errors = new ArrayList<>();
        if (username == null || username.isBlank()) errors.add("username không được để trống");
        if (password != null && !password.isBlank() && password.length() < 6) errors.add("password phải có ít nhất 6 ký tự");
        if (email == null || email.isBlank() || !email.contains("@")) errors.add("email không hợp lệ");
        String normalizedStatus = statusValue(status);
        if (!Set.of("ACTIVE", "INACTIVE", "LOCKED").contains(normalizedStatus)) {
            errors.add("status chỉ được là ACTIVE, INACTIVE hoặc LOCKED");
        }
        return errors;
    }

    private LecturerRow parseLecturerRow(Row row, Map<String, Integer> headerMap, DataFormatter formatter) {
        LecturerRow input = new LecturerRow();
        input.username = cell(row, headerMap, formatter, "username", "user_name", "login_name");
        input.password = cell(row, headerMap, formatter, "password", "mat_khau");
        input.email = cell(row, headerMap, formatter, "email");
        input.lecturerCode = cell(row, headerMap, formatter, "lecturer_code", "lecturerCode", "staff_code", "code");
        input.fullName = cell(row, headerMap, formatter, "full_name", "fullName", "name", "ho_ten");
        input.departmentId = integerValue(cell(row, headerMap, formatter, "department_id", "departmentId", "faculty_id", "facultyId"));
        input.phone = cell(row, headerMap, formatter, "phone", "phone_number", "sdt");
        input.status = cell(row, headerMap, formatter, "status", "is_active", "isActive");
        return input;
    }

    private FacilityStaffRow parseFacilityStaffRow(Row row, Map<String, Integer> headerMap, DataFormatter formatter) {
        FacilityStaffRow input = new FacilityStaffRow();
        input.username = cell(row, headerMap, formatter, "username", "user_name", "login_name");
        input.password = cell(row, headerMap, formatter, "password", "mat_khau");
        input.email = cell(row, headerMap, formatter, "email");
        input.staffCode = cell(row, headerMap, formatter, "staff_code", "staffCode", "code");
        input.buildingId = integerValue(cell(row, headerMap, formatter, "building_id", "buildingId"));
        input.note = cell(row, headerMap, formatter, "note", "ghi_chu");
        input.status = cell(row, headerMap, formatter, "status", "is_active", "isActive");
        return input;
    }

    private ResponseEntity<byte[]> workbookResponse(String filename, String sheetName, List<String> headers, List<Object> sample) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(sheetName);
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                header.createCell(i).setCellValue(headers.get(i));
                sheet.setColumnWidth(i, 5500);
            }

            Row sampleRow = sheet.createRow(1);
            for (int i = 0; i < sample.size(); i++) {
                Object value = sample.get(i);
                if (value instanceof Number number) sampleRow.createCell(i).setCellValue(number.doubleValue());
                else sampleRow.createCell(i).setCellValue(String.valueOf(value));
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            responseHeaders.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
            return ResponseEntity.ok().headers(responseHeaders).body(out.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().contentType(MediaType.TEXT_PLAIN).body(("Cannot create template: " + e.getMessage()).getBytes());
        }
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

    private Integer integerValue(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isBlank()) return null;
        try {
            if (text.endsWith(".0")) text = text.substring(0, text.length() - 2);
            return Integer.parseInt(text);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String statusValue(String value) {
        String text = value == null ? "" : value.trim();
        if (text.isBlank()) return "ACTIVE";
        if ("1".equals(text) || "true".equalsIgnoreCase(text)) return "ACTIVE";
        if ("0".equals(text) || "false".equalsIgnoreCase(text)) return "INACTIVE";
        return text.toUpperCase(Locale.ROOT);
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

    private boolean existsBuilding(Integer id) {
        if (id == null) return false;
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM buildings WHERE building_id = ? AND is_deleted = 0", Integer.class, id);
        return count != null && count > 0;
    }

    private void cleanupUser(Number userId) {
        if (userId == null) return;
        try { jdbcTemplate.update("DELETE FROM users WHERE user_id = ?", userId); } catch (Exception ignored) { }
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }

    private String cleanError(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) return ex.getClass().getSimpleName();
        return message.length() > 300 ? message.substring(0, 300) + "..." : message;
    }

    private Map<String, Object> errorItem(int row, List<String> rowErrors) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("row", row);
        item.put("errors", rowErrors);
        return item;
    }

    private Map<String, Object> resultData(List<Map<String, Object>> imported, List<Map<String, Object>> errors) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("importedCount", imported.size());
        data.put("errorCount", errors.size());
        data.put("imported", imported);
        data.put("errors", errors);
        return data;
    }

    private Map<String, Object> response(boolean success, String message, Object data) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", success);
        res.put("message", message);
        res.put("data", data);
        return res;
    }

    private static class LecturerRow {
        String username = "";
        String password = "";
        String email = "";
        String lecturerCode = "";
        String fullName = "";
        Integer departmentId;
        String phone = "";
        String status = "";
    }

    private static class FacilityStaffRow {
        String username = "";
        String password = "";
        String email = "";
        String staffCode = "";
        Integer buildingId;
        String note = "";
        String status = "";
    }
}
