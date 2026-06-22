package com.ptit.qlphonghoc.dashboard.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final JdbcTemplate jdbcTemplate;

    public DashboardController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/admin/dashboard")
    public ApiResponse<Map<String, Object>> getAdminDashboard() {
        Map<String, Object> data = new HashMap<>();

        // Get active semester name
        String semesterSql = """
            SELECT semester_name FROM semesters 
            WHERE is_deleted = FALSE AND status = 'ACTIVE' 
            LIMIT 1
            """;
        List<String> semesters = jdbcTemplate.queryForList(semesterSql, String.class);
        String activeSemesterName = semesters.isEmpty() ? "Học kỳ 1 năm học 2025-2026" : semesters.get(0);
        data.put("activeSemester", Map.of("name", activeSemesterName));

        // Get total counts
        int totalClassrooms = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM classrooms WHERE is_deleted = FALSE", Integer.class);
        int totalCourses = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM courses WHERE is_deleted = FALSE", Integer.class);
        int scheduledClasses = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM class_sections WHERE status <> 'CANCELLED'", Integer.class);
        
        // Count conflicts
        String conflictSql = """
            SELECT COUNT(DISTINCT sch.section_id)
            FROM schedules sch
            JOIN class_sections cs ON cs.section_id = sch.section_id
            WHERE sch.status = 'ASSIGNED'
              AND cs.status <> 'CANCELLED'
              AND EXISTS (
                  SELECT 1
                  FROM schedules sch2
                  JOIN class_sections cs2 ON cs2.section_id = sch2.section_id
                  WHERE sch2.status = 'ASSIGNED'
                    AND cs2.status <> 'CANCELLED'
                    AND sch2.classroom_id = sch.classroom_id
                    AND sch2.day_of_week = sch.day_of_week
                    AND sch2.slot_start_id <= sch.slot_end_id
                    AND sch2.slot_end_id >= sch.slot_start_id
                    AND sch2.schedule_id <> sch.schedule_id
              )
            """;
        int conflictAlerts = jdbcTemplate.queryForObject(conflictSql, Integer.class);

        data.put("summary", Map.of(
            "totalClassrooms", totalClassrooms,
            "totalCourses", totalCourses,
            "scheduledClasses", scheduledClasses,
            "conflictAlerts", conflictAlerts
        ));

        // Mapped Usage by Weekday
        List<Map<String, Object>> roomUsageByWeekday = List.of(
            Map.of("day", "T2", "usage", queryUsageForDay("MON")),
            Map.of("day", "T3", "usage", queryUsageForDay("TUE")),
            Map.of("day", "T4", "usage", queryUsageForDay("WED")),
            Map.of("day", "T5", "usage", queryUsageForDay("THU")),
            Map.of("day", "T6", "usage", queryUsageForDay("FRI")),
            Map.of("day", "T7", "usage", queryUsageForDay("SAT")),
            Map.of("day", "CN", "usage", queryUsageForDay("SUN"))
        );
        data.put("roomUsageByWeekday", roomUsageByWeekday);

        // Utilization rate
        int assignedCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM schedules WHERE status = 'ASSIGNED'", Integer.class);
        int unassignedCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM schedules WHERE status = 'UNASSIGNED'", Integer.class);
        data.put("roomUtilizationRate", List.of(
            Map.of("name", "Đã phân phòng", "value", assignedCount, "color", "#3b82f6"),
            Map.of("name", "Chưa phân phòng", "value", unassignedCount, "color", "#10b981"),
            Map.of("name", "Trùng lịch", "value", conflictAlerts, "color", "#ef4444")
        ));

        // Today's schedule preview
        String previewSql = """
            SELECT DISTINCT
                CONCAT(ts_start.slot_no, '-', ts_end.slot_no) AS time,
                c.course_name AS course,
                CONCAT(b.building_code, '-', cr.room_number) AS room,
                sch.status AS status
            FROM schedules sch
            JOIN class_sections cs ON cs.section_id = sch.section_id
            JOIN courses c ON c.course_id = cs.course_id
            LEFT JOIN classrooms cr ON cr.classroom_id = sch.classroom_id
            LEFT JOIN buildings b ON b.building_id = cr.building_id
            LEFT JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
            LEFT JOIN time_slots ts_end ON ts_end.slot_id = sch.slot_end_id
            WHERE cs.status <> 'CANCELLED'
            LIMIT 5
            """;
        List<Map<String, Object>> preview = jdbcTemplate.queryForList(previewSql);
        data.put("todaySchedulePreview", preview);

        return ApiResponse.success("Lấy thông tin tổng quan Admin thành công", data);
    }

    private int queryUsageForDay(String dayCode) {
        String sql = "SELECT COUNT(*) FROM schedules WHERE status = 'ASSIGNED' AND day_of_week = ?";
        return jdbcTemplate.queryForObject(sql, Integer.class, dayCode);
    }

    @GetMapping("/staff/dashboard")
    public ApiResponse<Map<String, Object>> getStaffDashboard() {
        Map<String, Object> data = new HashMap<>();

        // Get active semester name
        String semesterSql = """
            SELECT semester_name FROM semesters 
            WHERE is_deleted = FALSE AND status = 'ACTIVE' 
            LIMIT 1
            """;
        List<String> semesters = jdbcTemplate.queryForList(semesterSql, String.class);
        String activeSemesterName = semesters.isEmpty() ? "Học kỳ 1 năm học 2025-2026" : semesters.get(0);
        data.put("activeSemester", Map.of("name", activeSemesterName));

        int totalSections = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM class_sections WHERE status <> 'CANCELLED'", Integer.class);
        int assignedSections = jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM schedules sch
            JOIN class_sections cs ON cs.section_id = sch.section_id
            WHERE sch.status = 'ASSIGNED' AND cs.status <> 'CANCELLED'
            """, Integer.class);
        int pendingBorrowRequests = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room_borrow_requests WHERE status = 'PENDING'", Integer.class);

        data.put("stats", List.of(
            Map.of("title", "Lớp học phần", "value", String.valueOf(totalSections), "sub", activeSemesterName, "color", "bg-blue-500", "text", "text-blue-700"),
            Map.of("title", "Đã phân phòng", "value", String.valueOf(assignedSections), "sub", "Tổng số lớp đã xếp", "color", "bg-green-500", "text", "text-green-700"),
            Map.of("title", "Chờ xếp phòng", "value", String.valueOf(totalSections - assignedSections), "sub", "Cần phân phòng sớm", "color", "bg-orange-500", "text", "text-orange-700"),
            Map.of("title", "Yêu cầu mượn phòng", "value", String.valueOf(pendingBorrowRequests), "sub", "Chờ duyệt từ Staff", "color", "bg-purple-500", "text", "text-purple-700")
        ));

        data.put("progress", Map.of(
            "total", totalSections,
            "assigned", assignedSections,
            "pending", totalSections - assignedSections,
            "conflicts", 0,
            "percent", totalSections == 0 ? 0 : Math.round((double) assignedSections / totalSections * 100)
        ));

        return ApiResponse.success("Lấy thông tin tổng quan Giáo vụ thành công", data);
    }

    @GetMapping("/lecturer/dashboard")
    public ApiResponse<Map<String, Object>> getLecturerDashboard() {
        Map<String, Object> data = new HashMap<>();
        // Return structured statistics for lecturers
        data.put("stats", List.of(
            Map.of("title", "Lớp giảng dạy", "value", "3", "sub", "Học kỳ này"),
            Map.of("title", "Giờ lên lớp/Tuần", "value", "12", "sub", "Giờ chuẩn"),
            Map.of("title", "Yêu cầu đổi phòng", "value", "1", "sub", "1 Chờ duyệt")
        ));
        return ApiResponse.success("Lấy thông tin tổng quan Giảng viên thành công", data);
    }

    @GetMapping("/student/dashboard")
    public ApiResponse<Map<String, Object>> getStudentDashboard() {
        Map<String, Object> data = new HashMap<>();
        // Return structured statistics for students
        data.put("stats", List.of(
            Map.of("title", "Môn học đã đăng ký", "value", "6", "sub", "Học kỳ này"),
            Map.of("title", "Lịch học hôm nay", "value", "2 ca học", "sub", "Phòng A-301, B-105"),
            Map.of("title", "Lịch thi sắp tới", "value", "3", "sub", "Bắt đầu từ tuần sau")
        ));
        return ApiResponse.success("Lấy thông tin tổng quan Sinh viên thành công", data);
    }
}
