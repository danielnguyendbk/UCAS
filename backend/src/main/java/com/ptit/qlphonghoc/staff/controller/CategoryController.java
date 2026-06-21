package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final JdbcTemplate jdbcTemplate;

    public CategoryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse<Map<String, List<Map<String, Object>>>> getAllCategories() {
        Map<String, List<Map<String, Object>>> categories = new LinkedHashMap<>();
        categories.put("faculties", findFaculties());
        categories.put("departments", findDepartments());
        categories.put("semesters", findSemesters());
        categories.put("courses", findCourses());
        categories.put("lecturers", findLecturers());
        categories.put("buildings", findBuildings());
        categories.put("classrooms", findClassrooms());
        categories.put("timeSlots", findTimeSlots());
        categories.put("classes", findClasses());
        categories.put("students", findStudents());
        categories.put("clubs", findClubs());
        return ApiResponse.success("OK", categories);
    }

    @GetMapping("/all")
    public ApiResponse<Map<String, List<Map<String, Object>>>> getAllCategoriesAlias() {
        return getAllCategories();
    }

    @GetMapping("/faculties")
    public ApiResponse<List<Map<String, Object>>> getFaculties() {
        return ApiResponse.success("OK", findFaculties());
    }

    @GetMapping("/departments")
    public ApiResponse<List<Map<String, Object>>> getDepartments() {
        return ApiResponse.success("OK", findDepartments());
    }

    @GetMapping("/semesters")
    public ApiResponse<List<Map<String, Object>>> getSemesters() {
        return ApiResponse.success("OK", findSemesters());
    }

    @GetMapping("/courses")
    public ApiResponse<List<Map<String, Object>>> getCourses() {
        return ApiResponse.success("OK", findCourses());
    }

    @GetMapping("/lecturers")
    public ApiResponse<List<Map<String, Object>>> getLecturers() {
        return ApiResponse.success("OK", findLecturers());
    }

    @GetMapping("/buildings")
    public ApiResponse<List<Map<String, Object>>> getBuildings() {
        return ApiResponse.success("OK", findBuildings());
    }

    @GetMapping("/classrooms")
    public ApiResponse<List<Map<String, Object>>> getClassrooms() {
        return ApiResponse.success("OK", findClassrooms());
    }

    @GetMapping("/time-slots")
    public ApiResponse<List<Map<String, Object>>> getTimeSlots() {
        return ApiResponse.success("OK", findTimeSlots());
    }

    @GetMapping("/classes")
    public ApiResponse<List<Map<String, Object>>> getClasses() {
        return ApiResponse.success("OK", findClasses());
    }

    @GetMapping("/students")
    public ApiResponse<List<Map<String, Object>>> getStudents() {
        return ApiResponse.success("OK", findStudents());
    }

    @GetMapping("/clubs")
    public ApiResponse<List<Map<String, Object>>> getClubs() {
        return ApiResponse.success("OK", findClubs());
    }

    private List<Map<String, Object>> findFaculties() {
        return List.of();
    }

    private List<Map<String, Object>> findDepartments() {
        String sql = """
            SELECT d.department_id AS id,
                   d.department_code AS code,
                   d.department_name AS name
            FROM departments d
            WHERE d.is_deleted = FALSE
            ORDER BY d.department_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findSemesters() {
        String sql = """
            SELECT s.semester_id AS id,
                   s.academic_year_id AS academicYearId,
                   ay.year_label AS academicYear,
                   s.semester_name AS name,
                   s.semester_type AS type,
                   s.start_date AS startDate,
                   s.end_date AS endDate,
                   s.status,
                   s.timetable_status AS timetableStatus
            FROM semesters s
            JOIN academic_years ay ON s.academic_year_id = ay.academic_year_id
            WHERE s.is_deleted = FALSE
              AND ay.is_deleted = FALSE
            ORDER BY
                CASE s.status
                    WHEN 'ACTIVE' THEN 0
                    WHEN 'UPCOMING' THEN 1
                    WHEN 'COMPLETED' THEN 2
                    ELSE 3
                END,
                s.start_date
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findCourses() {
        String sql = """
            SELECT c.course_id AS id,
                   c.department_id AS departmentId,
                   d.department_code AS departmentCode,
                   d.department_name AS departmentName,
                   NULL AS facultyCode,
                   c.course_code AS courseCode,
                   c.course_name AS name,
                   c.credits,
                   c.required_room_type AS requiredRoomType,
                   c.description
            FROM courses c
            JOIN departments d ON c.department_id = d.department_id
            WHERE c.is_deleted = FALSE
              AND d.is_deleted = FALSE
            ORDER BY c.course_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findLecturers() {
        String sql = """
            SELECT l.lecturer_id AS id,
                   l.user_id AS userId,
                   l.department_id AS departmentId,
                   d.department_code AS departmentCode,
                   d.department_name AS departmentName,
                   NULL AS facultyCode,
                   l.lecturer_code AS staffCode,
                   l.full_name AS name,
                   l.email,
                   l.phone
            FROM lecturers l
            JOIN departments d ON l.department_id = d.department_id
            WHERE l.is_deleted = FALSE
              AND d.is_deleted = FALSE
            ORDER BY l.full_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findBuildings() {
        String sql = """
            SELECT building_id AS id,
                   building_code AS code,
                   building_name AS name
            FROM buildings
            WHERE is_deleted = FALSE
            ORDER BY building_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findClassrooms() {
        String sql = """
            SELECT c.classroom_id AS id,
                   c.building_id AS buildingId,
                   b.building_code AS buildingCode,
                   b.building_name AS buildingName,
                   c.floor_number AS floorNumber,
                   c.room_number AS roomNumber,
                   c.classroom_name AS roomName,
                   c.room_type AS roomType,
                   c.capacity,
                   c.has_projector AS hasProjector,
                   c.has_ac AS hasAc,
                   c.is_active AS active
            FROM classrooms c
            JOIN buildings b ON c.building_id = b.building_id
            WHERE c.is_deleted = FALSE
              AND b.is_deleted = FALSE
            ORDER BY b.building_name, c.floor_number, c.room_number
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findTimeSlots() {
        String sql = """
            SELECT slot_id AS slotId,
                   slot_no AS slotNo,
                   slot_label AS slotLabel,
                   start_time AS startTime,
                   end_time AS endTime
            FROM time_slots
            ORDER BY slot_no
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findClasses() {
        String sql = """
            SELECT s.class_name AS id,
                   s.class_name AS classCode,
                   s.class_name AS className,
                   COUNT(*) AS studentCount
            FROM students s
            WHERE s.is_deleted = FALSE
            GROUP BY s.class_name
            ORDER BY s.class_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findStudents() {
        String sql = """
            SELECT s.student_id AS id,
                   s.user_id AS userId,
                   s.department_id AS facultyId,
                   d.department_code AS facultyCode,
                   d.department_name AS facultyName,
                   NULL AS classId,
                   s.class_name AS classCode,
                   s.student_code AS studentCode,
                   u.username AS name,
                   s.class_name AS className,
                   s.course_year AS courseYear,
                   s.phone
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            JOIN departments d ON s.department_id = d.department_id
            WHERE s.is_deleted = FALSE
              AND u.status = 'ACTIVE'
              AND d.is_deleted = FALSE
            ORDER BY u.username
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findClubs() {
        String sql = """
            SELECT c.club_id AS id,
                   c.club_code AS clubCode,
                   c.club_name AS clubName,
                   c.department_id AS facultyId,
                   d.department_code AS facultyCode,
                   d.department_name AS facultyName,
                   c.advisor_user_id AS advisorUserId,
                   u.username AS advisorName,
                   c.status
            FROM clubs c
            JOIN departments d ON c.department_id = d.department_id
            LEFT JOIN users u ON c.advisor_user_id = u.user_id
            WHERE c.is_deleted = FALSE
              AND d.is_deleted = FALSE
            ORDER BY c.club_name
            """;
        return jdbcTemplate.queryForList(sql);
    }
}
