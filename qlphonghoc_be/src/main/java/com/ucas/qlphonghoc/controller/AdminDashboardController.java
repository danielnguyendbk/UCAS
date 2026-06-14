package com.ucas.qlphonghoc.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Time;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AdminDashboardController {

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    public AdminDashboardController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, Object> getDashboard() {
        Map<String, Object> response = new LinkedHashMap<>();

        Map<String, Object> activeSemester = getActiveSemester();
        Integer activeSemesterId = activeSemester.get("id") == null
                ? null
                : ((Number) activeSemester.get("id")).intValue();

        response.put("activeSemester", activeSemester);
        response.put("summary", getSummary(activeSemesterId));
        response.put("roomUsageByWeekday", getRoomUsageByWeekday(activeSemesterId));
        response.put("roomUtilizationRate", getRoomUtilizationRate(activeSemesterId));
        response.put("todaySchedulePreview", getTodaySchedulePreview(activeSemesterId));

        return response;
    }

    private Map<String, Object> getActiveSemester() {
        String sql = """
                SELECT id, semester_name
                FROM semesters
                WHERE status = 'ACTIVE'
                  AND is_deleted = 0
                ORDER BY start_date DESC
                LIMIT 1
                """;

        List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", rs.getInt("id"));
            item.put("name", rs.getString("semester_name"));
            return item;
        });

        if (rows.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("id", null);
            empty.put("name", "Chưa xác định học kỳ active");
            return empty;
        }

        return rows.get(0);
    }

    private Map<String, Object> getSummary(Integer semesterId) {
        Map<String, Object> summary = new LinkedHashMap<>();

        Integer totalClassrooms = queryInt("""
                SELECT COUNT(*)
                FROM classrooms
                WHERE is_active = 1
                """);

        Integer totalCourses = queryInt("""
                SELECT COUNT(*)
                FROM courses
                WHERE is_deleted = 0
                """);

        Integer scheduledClasses = countActiveSchedules(semesterId);
        Integer conflictAlerts = countConflictAlerts(semesterId);

        summary.put("totalClassrooms", totalClassrooms);
        summary.put("totalCourses", totalCourses);
        summary.put("scheduledClasses", scheduledClasses);
        summary.put("conflictAlerts", conflictAlerts);

        return summary;
    }

    private Integer countActiveSchedules(Integer semesterId) {
        if (semesterId != null) {
            return queryInt("""
                    SELECT COUNT(*)
                    FROM schedules s
                    JOIN class_sections sec ON s.section_id = sec.id
                    WHERE sec.semester_id = ?
                      AND s.status = 'ACTIVE'
                    """, semesterId);
        }

        return queryInt("""
                SELECT COUNT(*)
                FROM schedules s
                WHERE s.status = 'ACTIVE'
                """);
    }

    private Integer countConflictAlerts(Integer semesterId) {
        String semesterFilter1 = semesterId == null ? "" : " AND sec1.semester_id = ? ";
        String semesterFilter2 = semesterId == null ? "" : " AND sec2.semester_id = ? ";

        String classroomConflictSql = """
                SELECT COUNT(*)
                FROM schedules s1
                JOIN schedules s2
                  ON s1.id < s2.id
                 AND s1.classroom_id = s2.classroom_id
                 AND s1.day_of_week = s2.day_of_week
                 AND s1.slot_start_id <= s2.slot_end_id
                 AND s2.slot_start_id <= s1.slot_end_id
                JOIN class_sections sec1 ON s1.section_id = sec1.id
                JOIN class_sections sec2 ON s2.section_id = sec2.id
                WHERE s1.status = 'ACTIVE'
                  AND s2.status = 'ACTIVE'
                """ + semesterFilter1 + semesterFilter2;

        String lecturerConflictSql = """
                SELECT COUNT(*)
                FROM schedules s1
                JOIN schedules s2
                  ON s1.id < s2.id
                 AND s1.day_of_week = s2.day_of_week
                 AND s1.slot_start_id <= s2.slot_end_id
                 AND s2.slot_start_id <= s1.slot_end_id
                JOIN class_sections sec1 ON s1.section_id = sec1.id
                JOIN class_sections sec2 ON s2.section_id = sec2.id
                WHERE s1.status = 'ACTIVE'
                  AND s2.status = 'ACTIVE'
                  AND sec1.lecturer_id = sec2.lecturer_id
                """ + semesterFilter1 + semesterFilter2;

        int classroomConflicts;
        int lecturerConflicts;

        if (semesterId != null) {
            classroomConflicts = queryInt(classroomConflictSql, semesterId, semesterId);
            lecturerConflicts = queryInt(lecturerConflictSql, semesterId, semesterId);
        } else {
            classroomConflicts = queryInt(classroomConflictSql);
            lecturerConflicts = queryInt(lecturerConflictSql);
        }

        return classroomConflicts + lecturerConflicts;
    }

    private List<Map<String, Object>> getRoomUsageByWeekday(Integer semesterId) {
        return getRoomUsageFromSchedules(semesterId);
    }

    private List<Map<String, Object>> getRoomUsageFromSchedules(Integer semesterId) {
        Map<String, Integer> usage = new LinkedHashMap<>();
        usage.put("T2", 0);
        usage.put("T3", 0);
        usage.put("T4", 0);
        usage.put("T5", 0);
        usage.put("T6", 0);
        usage.put("T7", 0);

        List<Map<String, Object>> rows;

        if (semesterId != null) {
            rows = jdbcTemplate.query("""
                    SELECT s.day_of_week, COUNT(*) AS total
                    FROM schedules s
                    JOIN class_sections sec ON s.section_id = sec.id
                    WHERE sec.semester_id = ?
                      AND s.status = 'ACTIVE'
                    GROUP BY s.day_of_week
                    """, (rs, rowNum) -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("dayOfWeek", rs.getString("day_of_week"));
                item.put("total", rs.getInt("total"));
                return item;
            }, semesterId);
        } else {
            rows = jdbcTemplate.query("""
                    SELECT s.day_of_week, COUNT(*) AS total
                    FROM schedules s
                    WHERE s.status = 'ACTIVE'
                    GROUP BY s.day_of_week
                    """, (rs, rowNum) -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("dayOfWeek", rs.getString("day_of_week"));
                item.put("total", rs.getInt("total"));
                return item;
            });
        }

        for (Map<String, Object> row : rows) {
            String dayOfWeek = String.valueOf(row.get("dayOfWeek"));
            int total = ((Number) row.get("total")).intValue();

            String label = switch (dayOfWeek) {
                case "MON" -> "T2";
                case "TUE" -> "T3";
                case "WED" -> "T4";
                case "THU" -> "T5";
                case "FRI" -> "T6";
                case "SAT" -> "T7";
                default -> null;
            };

            if (label != null) {
                usage.put(label, total);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        usage.forEach((day, value) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("day", day);
            item.put("usage", value);
            result.add(item);
        });

        return result;
    }

    private List<Map<String, Object>> getRoomUtilizationRate(Integer semesterId) {
        List<Integer> usageCounts = getRoomUtilizationCountsFromSchedules(semesterId);

        int maxUsage = usageCounts.stream()
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0);

        int high = 0;
        int medium = 0;
        int low = 0;

        if (maxUsage == 0) {
            low = usageCounts.size();
        } else {
            int highThreshold = Math.max(2, (int) Math.ceil(maxUsage * 0.67));
            int mediumThreshold = Math.max(1, (int) Math.ceil(maxUsage * 0.34));

            for (Integer count : usageCounts) {
                if (count >= highThreshold) {
                    high++;
                } else if (count >= mediumThreshold) {
                    medium++;
                } else {
                    low++;
                }
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        result.add(utilizationItem("Sử dụng cao", high, "#3b82f6"));
        result.add(utilizationItem("Sử dụng trung bình", medium, "#10b981"));
        result.add(utilizationItem("Sử dụng thấp", low, "#f59e0b"));

        return result;
    }

    private List<Integer> getRoomUtilizationCountsFromSchedules(Integer semesterId) {
        if (semesterId != null) {
            return jdbcTemplate.query("""
                    SELECT r.id, COALESCE(x.usage_count, 0) AS usage_count
                    FROM classrooms r
                    LEFT JOIN (
                        SELECT s.classroom_id, COUNT(*) AS usage_count
                        FROM schedules s
                        JOIN class_sections sec ON s.section_id = sec.id
                        WHERE sec.semester_id = ?
                          AND s.status = 'ACTIVE'
                        GROUP BY s.classroom_id
                    ) x ON x.classroom_id = r.id
                    WHERE r.is_active = 1
                    ORDER BY r.id
                    """, (rs, rowNum) -> rs.getInt("usage_count"), semesterId);
        }

        return jdbcTemplate.query("""
                SELECT r.id, COALESCE(x.usage_count, 0) AS usage_count
                FROM classrooms r
                LEFT JOIN (
                    SELECT s.classroom_id, COUNT(*) AS usage_count
                    FROM schedules s
                    WHERE s.status = 'ACTIVE'
                    GROUP BY s.classroom_id
                ) x ON x.classroom_id = r.id
                WHERE r.is_active = 1
                ORDER BY r.id
                """, (rs, rowNum) -> rs.getInt("usage_count"));
    }

    private Map<String, Object> utilizationItem(String name, int value, String color) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", name);
        item.put("value", value);
        item.put("color", color);
        return item;
    }

    private List<Map<String, Object>> getTodaySchedulePreview(Integer semesterId) {
        String sql;
        Object[] args;

        if (semesterId != null) {
            sql = """
                    SELECT
                        cs.start_time,
                        cs.end_time,
                        c.course_code,
                        c.course_name,
                        r.room_number,
                        r.room_name
                    FROM class_sessions cs
                    JOIN class_sections sec ON cs.section_id = sec.id
                    JOIN courses c ON sec.course_id = c.id
                    LEFT JOIN classrooms r ON cs.classroom_id = r.id
                    WHERE cs.session_date = CURDATE()
                      AND sec.semester_id = ?
                      AND cs.session_status IN ('SCHEDULED', 'MAKEUP', 'RESCHEDULED')
                    ORDER BY cs.start_time ASC
                    LIMIT 5
                    """;
            args = new Object[]{semesterId};
        } else {
            sql = """
                    SELECT
                        cs.start_time,
                        cs.end_time,
                        c.course_code,
                        c.course_name,
                        r.room_number,
                        r.room_name
                    FROM class_sessions cs
                    JOIN class_sections sec ON cs.section_id = sec.id
                    JOIN courses c ON sec.course_id = c.id
                    LEFT JOIN classrooms r ON cs.classroom_id = r.id
                    WHERE cs.session_date = CURDATE()
                      AND cs.session_status IN ('SCHEDULED', 'MAKEUP', 'RESCHEDULED')
                    ORDER BY cs.start_time ASC
                    LIMIT 5
                    """;
            args = new Object[]{};
        }

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Time start = rs.getTime("start_time");
            Time end = rs.getTime("end_time");

            String courseCode = rs.getString("course_code");
            String courseName = rs.getString("course_name");
            String roomNumber = rs.getString("room_number");
            String roomName = rs.getString("room_name");

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("time", formatTime(start) + " - " + formatTime(end));
            item.put("course", courseCode != null && !courseCode.isBlank() ? courseCode : courseName);
            item.put("room", roomName != null && !roomName.isBlank() ? roomName : roomNumber);
            item.put("status", getSessionStatus(start, end));

            return item;
        }, args);
    }

    private String getSessionStatus(Time start, Time end) {
        if (start == null || end == null) {
            return "upcoming";
        }

        LocalTime now = LocalTime.now();
        LocalTime startTime = start.toLocalTime();
        LocalTime endTime = end.toLocalTime();

        if (!now.isBefore(startTime) && !now.isAfter(endTime)) {
            return "ongoing";
        }

        return "upcoming";
    }

    private String formatTime(Time time) {
        if (time == null) {
            return "";
        }

        return time.toLocalTime().format(TIME_FORMATTER);
    }

    private Integer queryInt(String sql, Object... args) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }
}