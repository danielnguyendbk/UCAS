package com.ptit.qlphonghoc.admin.timetableimport.parser;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Component
public class TimetableImportFileParser implements TimetableImportParser {

    public static final List<String> HEADERS = List.of(
            "semester_code", "course_code", "section_code", "class_name", "lecturer_code",
            "enrolled_count", "max_capacity", "day_of_week", "slot_start_no", "slot_end_no",
            "from_week_no", "to_week_no", "session_type", "practice_group_no",
            "required_room_type", "preferred_building_code", "preferred_classroom_code"
    );
    private static final Set<String> REQUIRED_HEADERS = Set.of(
            "semester_code", "course_code", "section_code", "class_name", "lecturer_code",
            "enrolled_count", "max_capacity", "day_of_week", "slot_start_no", "slot_end_no",
            "from_week_no", "to_week_no", "session_type", "practice_group_no"
    );

    @Override
    public ParsedImportFile parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("IMPORT_FILE_REQUIRED", "Vui lòng chọn file import.");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        try {
            ParsedImportFile parsed;
            if (filename.endsWith(".xlsx")) {
                parsed = parseXlsx(file);
            } else if (filename.endsWith(".csv")) {
                parsed = parseCsv(file);
            } else {
                throw new BadRequestException("IMPORT_FILE_INVALID_TYPE", "Chỉ hỗ trợ file .xlsx hoặc .csv.");
            }
            if (parsed.rows().isEmpty()) {
                throw new BadRequestException("IMPORT_FILE_EMPTY", "File import không có dòng dữ liệu.");
            }
            return parsed;
        } catch (BadRequestException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadRequestException("IMPORT_PARSE_ERROR", "Không thể đọc file import.");
        }
    }

    private ParsedImportFile parseXlsx(MultipartFile file) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() == 0 ? null : workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                return new ParsedImportFile(List.of(), List.of());
            }
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            List<String> headers = new ArrayList<>();
            for (int index = 0; index < headerRow.getLastCellNum(); index++) {
                headers.add(normalizeHeader(formatter.formatCellValue(headerRow.getCell(index))));
            }
            validateHeaders(headers);
            List<Map<String, String>> rows = new ArrayList<>();
            List<Integer> rowNumbers = new ArrayList<>();
            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                Map<String, String> values = new LinkedHashMap<>();
                boolean nonBlank = false;
                for (int column = 0; column < headers.size(); column++) {
                    String value = row == null ? "" : formatter.formatCellValue(row.getCell(column)).trim();
                    if (!value.isBlank()) nonBlank = true;
                    if (!headers.get(column).isBlank()) values.put(headers.get(column), value);
                }
                if (nonBlank) {
                    rows.add(values);
                    rowNumbers.add(rowIndex + 1);
                }
            }
            return new ParsedImportFile(rows, rowNumbers);
        }
    }

    private ParsedImportFile parseCsv(MultipartFile file) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return new ParsedImportFile(List.of(), List.of());
            List<String> headers = parseCsvLine(stripBom(headerLine)).stream().map(this::normalizeHeader).toList();
            validateHeaders(headers);
            List<Map<String, String>> rows = new ArrayList<>();
            List<Integer> rowNumbers = new ArrayList<>();
            String line;
            int rowNumber = 1;
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (line.isBlank()) continue;
                List<String> cells = parseCsvLine(line);
                Map<String, String> values = new LinkedHashMap<>();
                boolean nonBlank = false;
                for (int index = 0; index < headers.size(); index++) {
                    String value = index < cells.size() ? cells.get(index).trim() : "";
                    if (!value.isBlank()) nonBlank = true;
                    if (!headers.get(index).isBlank()) values.put(headers.get(index), value);
                }
                if (nonBlank) {
                    rows.add(values);
                    rowNumbers.add(rowNumber);
                }
            }
            return new ParsedImportFile(rows, rowNumbers);
        }
    }

    private void validateHeaders(List<String> headers) {
        List<String> missing = REQUIRED_HEADERS.stream().filter(header -> !headers.contains(header)).sorted().toList();
        if (!missing.isEmpty()) {
            throw new BadRequestException("IMPORT_PARSE_ERROR", "File thiếu cột bắt buộc: " + String.join(", ", missing));
        }
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < line.length(); index++) {
            char character = line.charAt(index);
            if (character == '"') {
                if (quoted && index + 1 < line.length() && line.charAt(index + 1) == '"') {
                    current.append('"');
                    index++;
                } else {
                    quoted = !quoted;
                }
            } else if (character == ',' && !quoted) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(character);
            }
        }
        if (quoted) throw new BadRequestException("IMPORT_PARSE_ERROR", "CSV có dấu ngoặc kép không hợp lệ.");
        values.add(current.toString());
        return values;
    }

    private String normalizeHeader(String value) {
        return stripBom(value).trim().toLowerCase(Locale.ROOT).replace(' ', '_');
    }

    private String stripBom(String value) {
        return value != null && value.startsWith("\uFEFF") ? value.substring(1) : value;
    }
}
