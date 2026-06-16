package com.ptit.qlphonghoc.legacy.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
public class ReportsController {

    private final JdbcTemplate jdbcTemplate;

    public ReportsController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/{reportType}/preview")
    public ResponseEntity<Map<String, Object>> previewReport(
            @PathVariable String reportType) {
        try {
            ReportData report = buildReport(reportType);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("slug", report.slug);
            data.put("title", report.title);
            data.put("generatedAt", LocalDateTime.now().toString());
            data.put("columns", report.columns);
            data.put("rows", report.rows);
            data.put("totalRows", report.rows.size());

            return ResponseEntity.ok(response(true, "Generate report preview successfully", data));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(response(false, ex.getMessage(), null));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(
                    response(false, "Cannot generate report preview", ex.getMessage()));
        }
    }

    @GetMapping("/{reportType}/download")
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable String reportType) {
        try {
            ReportData report = buildReport(reportType);
            String csv = toCsv(report);

            String dateSuffix = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = report.fileNamePrefix + "_" + dateSuffix + ".csv";

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8");
            headers.setContentDisposition(
                    ContentDisposition.attachment()
                            .filename(fileName, StandardCharsets.UTF_8)
                            .build());

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .body(csv.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(ex.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("Cannot download report: " + ex.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    private ReportData buildReport(String reportType) {
        if ("weekly-room-utilization".equals(reportType)) {
            return weeklyRoomUtilizationReport();
        }

        if ("monthly-scheduling-summary".equals(reportType)) {
            return monthlySchedulingSummaryReport();
        }

        if ("conflict-resolution".equals(reportType)) {
            return conflictResolutionReport();
        }

        if ("lecturer-workload".equals(reportType)) {
            return lecturerWorkloadReport();
        }

        throw new IllegalArgumentException("Unknown report type: " + reportType);
    }

    private ReportData weeklyRoomUtilizationReport() {
        List<Map<String, String>> columns = columns(
                col("weekday", "Thứ"),
                col("room_code", "Mã phòng"),
                col("room_name", "Tên phòng"),
                col("room_type", "Loại phòng"),
                col("capacity", "Sức chứa"),
                col("scheduled_sessions", "Số buổi đã xếp"),
                col("scheduled_hours", "Số giờ sử dụng"));

        String sql = """
                SELECT
                    CASE s.day_of_week
                        WHEN 'MON' THEN 'T2'
                        WHEN 'TUE' THEN 'T3'
                        WHEN 'WED' THEN 'T4'
                        WHEN 'THU' THEN 'T5'
                        WHEN 'FRI' THEN 'T6'
                        WHEN 'SAT' THEN 'T7'
                        WHEN 'SUN' THEN 'CN'
                        ELSE s.day_of_week
                    END AS weekday,
                    CONCAT(COALESCE(b.building_code, 'Tòa'), '-', c.room_number) AS room_code,
                    COALESCE(c.classroom_name, CONCAT('Phòng ', c.room_number)) AS room_name,
                    c.room_type AS room_type,
                    c.capacity AS capacity,
                    COUNT(s.schedule_id) AS scheduled_sessions,
                    ROUND(SUM(TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time)) / 3600), 2) AS scheduled_hours
                FROM schedules s
                JOIN classrooms c ON c.classroom_id = s.classroom_id
                LEFT JOIN buildings b ON b.building_id = c.building_id
                WHERE s.status = 'ASSIGNED'
                GROUP BY
                    s.day_of_week,
                    c.classroom_id,
                    b.building_code,
                    c.room_number,
                    c.classroom_name,
                    c.room_type,
                    c.capacity
                ORDER BY
                    FIELD(s.day_of_week, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'),
                    room_code
                """;

        return new ReportData(
                "weekly-room-utilization",
                "Báo cáo sử dụng phòng theo tuần",
                "weekly_room_utilization",
                columns,
                jdbcTemplate.queryForList(sql));
    }

    private ReportData monthlySchedulingSummaryReport() {
        List<Map<String, String>> columns = columns(
                col("schedule_id", "Mã lịch"),
                col("semester_name", "Học kỳ"),
                col("course_code", "Mã môn"),
                col("course_name", "Tên môn học"),
                col("section_code", "Nhóm/Tổ"),
                col("lecturer_name", "Giảng viên"),
                col("room_code", "Phòng"),
                col("weekday", "Thứ"),
                col("slot_range", "Tiết"),
                col("time_range", "Thời gian"),
                col("week_range", "Tuần"),
                col("session_type", "Loại buổi"),
                col("status", "Trạng thái"));

        String sql = """
                SELECT
                    s.schedule_id AS schedule_id,
                    sem.semester_name AS semester_name,
                    co.course_code AS course_code,
                    co.course_name AS course_name,
                    cs.section_code AS section_code,
                    l.full_name AS lecturer_name,
                    CONCAT(COALESCE(b.building_code, 'Tòa'), '-', c.room_number) AS room_code,
                    CASE s.day_of_week
                        WHEN 'MON' THEN 'T2'
                        WHEN 'TUE' THEN 'T3'
                        WHEN 'WED' THEN 'T4'
                        WHEN 'THU' THEN 'T5'
                        WHEN 'FRI' THEN 'T6'
                        WHEN 'SAT' THEN 'T7'
                        WHEN 'SUN' THEN 'CN'
                        ELSE s.day_of_week
                    END AS weekday,
                    CONCAT(COALESCE(ts1.slot_label, s.slot_start_id), ' - ', COALESCE(ts2.slot_label, s.slot_end_id)) AS slot_range,
                    CONCAT(TIME_FORMAT(s.start_time, '%H:%i'), ' - ', TIME_FORMAT(s.end_time, '%H:%i')) AS time_range,
                    CONCAT(COALESCE(s.from_week_no, '?'), ' - ', COALESCE(s.to_week_no, '?')) AS week_range,
                    s.session_type AS session_type,
                    s.status AS status
                FROM schedules s
                JOIN class_sections cs ON cs.section_id = s.section_id
                JOIN semesters sem ON sem.semester_id = cs.semester_id
                JOIN courses co ON co.course_id = cs.course_id
                JOIN lecturers l ON l.lecturer_id = cs.lecturer_id
                JOIN classrooms c ON c.classroom_id = s.classroom_id
                LEFT JOIN buildings b ON b.building_id = c.building_id
                LEFT JOIN time_slots ts1 ON ts1.slot_id = s.slot_start_id
                LEFT JOIN time_slots ts2 ON ts2.slot_id = s.slot_end_id
                WHERE s.status = 'ASSIGNED'
                ORDER BY
                    FIELD(s.day_of_week, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'),
                    s.slot_start_id,
                    room_code,
                    co.course_code
                LIMIT 1000
                """;

        return new ReportData(
                "monthly-scheduling-summary",
                "Tổng hợp lịch học",
                "monthly_scheduling_summary",
                columns,
                jdbcTemplate.queryForList(sql));
    }

    private ReportData conflictResolutionReport() {
        List<Map<String, String>> columns = columns(
                col("schedule_a_id", "Lịch A"),
                col("schedule_b_id", "Lịch B"),
                col("weekday", "Thứ"),
                col("room_code", "Phòng"),
                col("class_a", "Lớp/Môn A"),
                col("class_b", "Lớp/Môn B"),
                col("slot_a", "Tiết A"),
                col("slot_b", "Tiết B"),
                col("week_a", "Tuần A"),
                col("week_b", "Tuần B"),
                col("conflict_reason", "Loại xung đột"));

        String sql = """
                SELECT
                    s1.schedule_id AS schedule_a_id,
                    s2.schedule_id AS schedule_b_id,
                    CASE s1.day_of_week
                        WHEN 'MON' THEN 'T2'
                        WHEN 'TUE' THEN 'T3'
                        WHEN 'WED' THEN 'T4'
                        WHEN 'THU' THEN 'T5'
                        WHEN 'FRI' THEN 'T6'
                        WHEN 'SAT' THEN 'T7'
                        WHEN 'SUN' THEN 'CN'
                        ELSE s1.day_of_week
                    END AS weekday,
                    CONCAT(COALESCE(b.building_code, 'Tòa'), '-', c.room_number) AS room_code,
                    CONCAT(co1.course_code, ' - ', co1.course_name, ' - Nhóm ', cs1.section_code) AS class_a,
                    CONCAT(co2.course_code, ' - ', co2.course_name, ' - Nhóm ', cs2.section_code) AS class_b,
                    CONCAT(s1.slot_start_id, ' - ', s1.slot_end_id) AS slot_a,
                    CONCAT(s2.slot_start_id, ' - ', s2.slot_end_id) AS slot_b,
                    CONCAT(COALESCE(s1.from_week_no, '?'), ' - ', COALESCE(s1.to_week_no, '?')) AS week_a,
                    CONCAT(COALESCE(s2.from_week_no, '?'), ' - ', COALESCE(s2.to_week_no, '?')) AS week_b,
                    'Trùng phòng, giao tiết và giao tuần' AS conflict_reason
                FROM schedules s1
                JOIN schedules s2
                    ON s1.schedule_id < s2.schedule_id
                   AND s1.classroom_id = s2.classroom_id
                   AND s1.day_of_week = s2.day_of_week
                   AND s1.status = 'ASSIGNED'
                   AND s2.status = 'ASSIGNED'
                   AND s1.slot_start_id <= s2.slot_end_id
                   AND s2.slot_start_id <= s1.slot_end_id
                   AND COALESCE(s1.from_week_no, 1) <= COALESCE(s2.to_week_no, 999)
                   AND COALESCE(s2.from_week_no, 1) <= COALESCE(s1.to_week_no, 999)
                JOIN classrooms c ON c.classroom_id = s1.classroom_id
                LEFT JOIN buildings b ON b.building_id = c.building_id
                JOIN class_sections cs1 ON cs1.section_id = s1.section_id
                JOIN class_sections cs2 ON cs2.section_id = s2.section_id
                JOIN courses co1 ON co1.course_id = cs1.course_id
                JOIN courses co2 ON co2.course_id = cs2.course_id
                ORDER BY
                    FIELD(s1.day_of_week, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'),
                    room_code,
                    s1.slot_start_id
                LIMIT 1000
                """;

        return new ReportData(
                "conflict-resolution",
                "Báo cáo xung đột lịch phòng",
                "conflict_resolution_report",
                columns,
                jdbcTemplate.queryForList(sql));
    }

    private ReportData lecturerWorkloadReport() {
        List<Map<String, String>> columns = columns(
                col("lecturer_name", "Giảng viên"),
                col("active_sections", "Số lớp học phần"),
                col("weekly_sessions", "Số buổi/tuần"),
                col("weekly_hours", "Số giờ/tuần"),
                col("semester_hours", "Tổng giờ theo tuần học"),
                col("courses", "Môn phụ trách"));

        String sql = """
                SELECT
                    l.full_name AS lecturer_name,
                    COUNT(DISTINCT cs.section_id) AS active_sections,
                    COUNT(s.schedule_id) AS weekly_sessions,
                    COALESCE(ROUND(SUM(TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time)) / 3600), 2), 0) AS weekly_hours,
                    COALESCE(
                        ROUND(
                            SUM(
                                (TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time)) / 3600)
                                * GREATEST(
                                    COALESCE(s.to_week_no, s.from_week_no, 1)
                                    - COALESCE(s.from_week_no, s.to_week_no, 1)
                                    + 1,
                                    1
                                )
                            ),
                            2
                        ),
                        0
                    ) AS semester_hours,
                    COALESCE(GROUP_CONCAT(DISTINCT co.course_code ORDER BY co.course_code SEPARATOR ', '), '') AS courses
                FROM lecturers l
                LEFT JOIN class_sections cs
                    ON cs.lecturer_id = l.lecturer_id
                   AND cs.status <> 'CANCELLED'
                LEFT JOIN courses co ON co.course_id = cs.course_id
                LEFT JOIN schedules s
                    ON s.section_id = cs.section_id
                   AND s.status = 'ASSIGNED'
                GROUP BY l.lecturer_id, l.full_name
                ORDER BY semester_hours DESC, l.full_name
                LIMIT 1000
                """;

        return new ReportData(
                "lecturer-workload",
                "Báo cáo khối lượng giảng dạy",
                "lecturer_workload_analysis",
                columns,
                jdbcTemplate.queryForList(sql));
    }

    private String toCsv(ReportData report) {
        StringBuilder csv = new StringBuilder();

        csv.append('\uFEFF');

        csv.append(escapeCsv(report.title)).append("\n");
        csv.append(escapeCsv("Ngày xuất")).append(",")
                .append(escapeCsv(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"))))
                .append("\n\n");

        for (int i = 0; i < report.columns.size(); i++) {
            if (i > 0) {
                csv.append(",");
            }

            csv.append(escapeCsv(report.columns.get(i).get("label")));
        }

        csv.append("\n");

        for (Map<String, Object> row : report.rows) {
            for (int i = 0; i < report.columns.size(); i++) {
                if (i > 0) {
                    csv.append(",");
                }

                String key = report.columns.get(i).get("key");
                Object value = row.get(key);

                csv.append(escapeCsv(value == null ? "" : String.valueOf(value)));
            }

            csv.append("\n");
        }

        if (report.rows.isEmpty()) {
            csv.append(escapeCsv("Không có dữ liệu")).append("\n");
        }

        return csv.toString();
    }

    private String escapeCsv(String value) {
        String safeValue = value == null ? "" : value;
        boolean needQuote = safeValue.contains(",")
                || safeValue.contains("\"")
                || safeValue.contains("\n")
                || safeValue.contains("\r");

        safeValue = safeValue.replace("\"", "\"\"");

        return needQuote ? "\"" + safeValue + "\"" : safeValue;
    }

    @SafeVarargs
    private final List<Map<String, String>> columns(Map<String, String>... items) {
        List<Map<String, String>> result = new ArrayList<>();

        for (Map<String, String> item : items) {
            result.add(item);
        }

        return result;
    }

    private Map<String, String> col(String key, String label) {
        Map<String, String> column = new LinkedHashMap<>();
        column.put("key", key);
        column.put("label", label);
        return column;
    }

    private Map<String, Object> response(boolean success, String message, Object data) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", success);
        res.put("message", message);
        res.put("data", data);
        return res;
    }

    private static class ReportData {
        private final String slug;
        private final String title;
        private final String fileNamePrefix;
        private final List<Map<String, String>> columns;
        private final List<Map<String, Object>> rows;

        private ReportData(
                String slug,
                String title,
                String fileNamePrefix,
                List<Map<String, String>> columns,
                List<Map<String, Object>> rows) {
            this.slug = slug;
            this.title = title;
            this.fileNamePrefix = fileNamePrefix;
            this.columns = columns;
            this.rows = rows;
        }
    }
}