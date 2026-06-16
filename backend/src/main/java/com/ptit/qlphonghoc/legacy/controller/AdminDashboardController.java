package com.ptit.qlphonghoc.legacy.controller;

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
        Integer activeSemesterId = activeSemester.get("id") == null ? null : ((Number) activeSemester.get("id")).intValue();
        response.put("activeSemester", activeSemester);
        response.put("summary", getSummary(activeSemesterId));
        response.put("roomUsageByWeekday", getRoomUsageByWeekday(activeSemesterId));
        response.put("roomUtilizationRate", getRoomUtilizationRate(activeSemesterId));
        response.put("todaySchedulePreview", getTodaySchedulePreview(activeSemesterId));
        return response;
    }

    private Map<String, Object> getActiveSemester() {
        List<Map<String, Object>> rows = jdbcTemplate.query("""
                SELECT semester_id, semester_name
                FROM semesters
                WHERE status = 'ACTIVE' AND is_deleted = 0
                ORDER BY start_date DESC
                LIMIT 1
                """, (rs, rowNum) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", rs.getInt("semester_id"));
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
        summary.put("totalClassrooms", queryInt("SELECT COUNT(*) FROM classrooms WHERE is_active = 1 AND is_deleted = 0"));
        summary.put("totalCourses", queryInt("SELECT COUNT(*) FROM courses WHERE is_deleted = 0"));
        summary.put("scheduledClasses", countAssignedSchedules(semesterId));
        summary.put("conflictAlerts", countConflictAlerts(semesterId));
        return summary;
    }

    private Integer countAssignedSchedules(Integer semesterId) {
        if (semesterId != null) {
            return queryInt("""
                    SELECT COUNT(*)
                    FROM schedules s
                    JOIN class_sections sec ON s.section_id = sec.section_id
                    WHERE sec.semester_id = ? AND s.status = 'ASSIGNED'
                    """, semesterId);
        }
        return queryInt("SELECT COUNT(*) FROM schedules WHERE status = 'ASSIGNED'");
    }

    private Integer countConflictAlerts(Integer semesterId) {
        String filter1 = semesterId == null ? "" : " AND sec1.semester_id = ? ";
        String filter2 = semesterId == null ? "" : " AND sec2.semester_id = ? ";
        String classroomSql = """
                SELECT COUNT(*)
                FROM schedules s1
                JOIN schedules s2
                  ON s1.schedule_id < s2.schedule_id
                 AND s1.classroom_id = s2.classroom_id
                 AND s1.day_of_week = s2.day_of_week
                 AND s1.slot_start_id <= s2.slot_end_id
                 AND s2.slot_start_id <= s1.slot_end_id
                 AND COALESCE(s1.from_week_no, 1) <= COALESCE(s2.to_week_no, 999)
                 AND COALESCE(s2.from_week_no, 1) <= COALESCE(s1.to_week_no, 999)
                JOIN class_sections sec1 ON s1.section_id = sec1.section_id
                JOIN class_sections sec2 ON s2.section_id = sec2.section_id
                WHERE s1.status = 'ASSIGNED' AND s2.status = 'ASSIGNED'
                """ + filter1 + filter2;
        String lecturerSql = """
                SELECT COUNT(*)
                FROM schedules s1
                JOIN schedules s2
                  ON s1.schedule_id < s2.schedule_id
                 AND s1.day_of_week = s2.day_of_week
                 AND s1.slot_start_id <= s2.slot_end_id
                 AND s2.slot_start_id <= s1.slot_end_id
                 AND COALESCE(s1.from_week_no, 1) <= COALESCE(s2.to_week_no, 999)
                 AND COALESCE(s2.from_week_no, 1) <= COALESCE(s1.to_week_no, 999)
                JOIN class_sections sec1 ON s1.section_id = sec1.section_id
                JOIN class_sections sec2 ON s2.section_id = sec2.section_id
                WHERE s1.status = 'ASSIGNED' AND s2.status = 'ASSIGNED'
                  AND sec1.lecturer_id = sec2.lecturer_id
                """ + filter1 + filter2;
        if (semesterId == null) return queryInt(classroomSql) + queryInt(lecturerSql);
        return queryInt(classroomSql, semesterId, semesterId) + queryInt(lecturerSql, semesterId, semesterId);
    }

    private List<Map<String, Object>> getRoomUsageByWeekday(Integer semesterId) {
        Map<String, Integer> usage = new LinkedHashMap<>();
        usage.put("T2", 0); usage.put("T3", 0); usage.put("T4", 0); usage.put("T5", 0); usage.put("T6", 0); usage.put("T7", 0);
        List<Map<String, Object>> rows;
        if (semesterId != null) {
            rows = jdbcTemplate.query("""
                    SELECT s.day_of_week, COUNT(*) AS total
                    FROM schedules s
                    JOIN class_sections sec ON s.section_id = sec.section_id
                    WHERE sec.semester_id = ? AND s.status = 'ASSIGNED'
                    GROUP BY s.day_of_week
                    """, (rs, rowNum) -> row(rs.getString("day_of_week"), rs.getInt("total")), semesterId);
        } else {
            rows = jdbcTemplate.query("""
                    SELECT day_of_week, COUNT(*) AS total
                    FROM schedules
                    WHERE status = 'ASSIGNED'
                    GROUP BY day_of_week
                    """, (rs, rowNum) -> row(rs.getString("day_of_week"), rs.getInt("total")));
        }
        for (Map<String, Object> row : rows) {
            String label = dayLabel(String.valueOf(row.get("dayOfWeek")));
            if (label != null) usage.put(label, ((Number) row.get("total")).intValue());
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
        List<Integer> usageCounts = getRoomUtilizationCounts(semesterId);
        int max = usageCounts.stream().mapToInt(Integer::intValue).max().orElse(0);
        int high = 0, medium = 0, low = 0;
        if (max == 0) low = usageCounts.size();
        else {
            int highThreshold = Math.max(2, (int) Math.ceil(max * 0.67));
            int mediumThreshold = Math.max(1, (int) Math.ceil(max * 0.34));
            for (Integer count : usageCounts) {
                if (count >= highThreshold) high++;
                else if (count >= mediumThreshold) medium++;
                else low++;
            }
        }
        List<Map<String, Object>> result = new ArrayList<>();
        result.add(utilizationItem("Sử dụng cao", high, "#3b82f6"));
        result.add(utilizationItem("Sử dụng trung bình", medium, "#10b981"));
        result.add(utilizationItem("Sử dụng thấp", low, "#f59e0b"));
        return result;
    }

    private List<Integer> getRoomUtilizationCounts(Integer semesterId) {
        if (semesterId != null) {
            return jdbcTemplate.query("""
                    SELECT r.classroom_id, COALESCE(x.usage_count, 0) AS usage_count
                    FROM classrooms r
                    LEFT JOIN (
                        SELECT s.classroom_id, COUNT(*) AS usage_count
                        FROM schedules s
                        JOIN class_sections sec ON s.section_id = sec.section_id
                        WHERE sec.semester_id = ? AND s.status = 'ASSIGNED' AND s.classroom_id IS NOT NULL
                        GROUP BY s.classroom_id
                    ) x ON x.classroom_id = r.classroom_id
                    WHERE r.is_active = 1 AND r.is_deleted = 0
                    ORDER BY r.classroom_id
                    """, (rs, rowNum) -> rs.getInt("usage_count"), semesterId);
        }
        return jdbcTemplate.query("""
                SELECT r.classroom_id, COALESCE(x.usage_count, 0) AS usage_count
                FROM classrooms r
                LEFT JOIN (
                    SELECT classroom_id, COUNT(*) AS usage_count
                    FROM schedules
                    WHERE status = 'ASSIGNED' AND classroom_id IS NOT NULL
                    GROUP BY classroom_id
                ) x ON x.classroom_id = r.classroom_id
                WHERE r.is_active = 1 AND r.is_deleted = 0
                ORDER BY r.classroom_id
                """, (rs, rowNum) -> rs.getInt("usage_count"));
    }

    private List<Map<String, Object>> getTodaySchedulePreview(Integer semesterId) {
        String sql;
        Object[] args;
        if (semesterId != null) {
            sql = """
                    SELECT cs.start_time, cs.end_time, c.course_code, c.course_name, r.room_number, r.classroom_name
                    FROM class_sessions cs
                    JOIN class_sections sec ON cs.section_id = sec.section_id
                    JOIN courses c ON sec.course_id = c.course_id
                    LEFT JOIN classrooms r ON cs.classroom_id = r.classroom_id
                    WHERE cs.session_date = CURDATE()
                      AND sec.semester_id = ?
                      AND cs.session_status IN ('SCHEDULED', 'MAKEUP', 'RESCHEDULED')
                    ORDER BY cs.start_time ASC
                    LIMIT 5
                    """;
            args = new Object[]{semesterId};
        } else {
            sql = """
                    SELECT cs.start_time, cs.end_time, c.course_code, c.course_name, r.room_number, r.classroom_name
                    FROM class_sessions cs
                    JOIN class_sections sec ON cs.section_id = sec.section_id
                    JOIN courses c ON sec.course_id = c.course_id
                    LEFT JOIN classrooms r ON cs.classroom_id = r.classroom_id
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
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("time", formatTime(start) + " - " + formatTime(end));
            String courseCode = rs.getString("course_code");
            String courseName = rs.getString("course_name");
            String roomNumber = rs.getString("room_number");
            String roomName = rs.getString("classroom_name");
            item.put("course", courseCode != null && !courseCode.isBlank() ? courseCode : courseName);
            item.put("room", roomName != null && !roomName.isBlank() ? roomName : roomNumber);
            item.put("status", getSessionStatus(start, end));
            return item;
        }, args);
    }

    private Map<String, Object> row(String dayOfWeek, int total) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("dayOfWeek", dayOfWeek);
        item.put("total", total);
        return item;
    }

    private String dayLabel(String dayOfWeek) {
        return switch (dayOfWeek) {
            case "MON" -> "T2"; case "TUE" -> "T3"; case "WED" -> "T4"; case "THU" -> "T5"; case "FRI" -> "T6"; case "SAT" -> "T7"; case "SUN" -> "CN"; default -> null;
        };
    }

    private Map<String, Object> utilizationItem(String name, int value, String color) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", name); item.put("value", value); item.put("color", color); return item;
    }

    private String getSessionStatus(Time start, Time end) {
        if (start == null || end == null) return "upcoming";
        LocalTime now = LocalTime.now();
        LocalTime startTime = start.toLocalTime();
        LocalTime endTime = end.toLocalTime();
        if (!now.isBefore(startTime) && !now.isAfter(endTime)) return "ongoing";
        return "upcoming";
    }

    private String formatTime(Time time) { return time == null ? "" : time.toLocalTime().format(TIME_FORMATTER); }

    private Integer queryInt(String sql, Object... args) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }
}
