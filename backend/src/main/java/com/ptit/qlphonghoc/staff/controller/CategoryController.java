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
        String sql = """
            SELECT id, code, name
            FROM faculties
            WHERE is_deleted = FALSE
            ORDER BY name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findDepartments() {
        String sql = """
            SELECT d.id,
                   d.code,
                   d.name,
                   d.faculty_id AS facultyId,
                   f.code AS facultyCode,
                   f.name AS facultyName
            FROM departments d
            JOIN faculties f ON d.faculty_id = f.id
            WHERE d.is_deleted = FALSE
              AND f.is_deleted = FALSE
            ORDER BY f.name, d.name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findSemesters() {
        String sql = """
            SELECT s.id,
                   s.academic_year_id AS academicYearId,
                   ay.year_label AS academicYear,
                   s.semester_name AS name,
                   s.semester_type AS type,
                   s.start_date AS startDate,
                   s.end_date AS endDate,
                   s.status
            FROM semesters s
            JOIN academic_years ay ON s.academic_year_id = ay.id
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
            SELECT c.id,
                   c.department_id AS departmentId,
                   d.code AS departmentCode,
                   d.name AS departmentName,
                   f.code AS facultyCode,
                   c.course_code AS courseCode,
                   c.course_name AS name,
                   c.credits,
                   c.required_room_type AS requiredRoomType,
                   c.description
            FROM courses c
            JOIN departments d ON c.department_id = d.id
            JOIN faculties f ON d.faculty_id = f.id
            WHERE c.is_deleted = FALSE
              AND d.is_deleted = FALSE
              AND f.is_deleted = FALSE
            ORDER BY c.course_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findLecturers() {
        String sql = """
            SELECT l.id,
                   l.user_id AS userId,
                   l.department_id AS departmentId,
                   d.code AS departmentCode,
                   d.name AS departmentName,
                   f.code AS facultyCode,
                   l.staff_code AS staffCode,
                   l.full_name AS name,
                   l.email,
                   l.phone
            FROM lecturers l
            JOIN departments d ON l.department_id = d.id
            JOIN faculties f ON d.faculty_id = f.id
            WHERE l.is_deleted = FALSE
              AND d.is_deleted = FALSE
              AND f.is_deleted = FALSE
            ORDER BY l.full_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findBuildings() {
        String sql = """
            SELECT id, code, name
            FROM buildings
            ORDER BY name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findClassrooms() {
        String sql = """
            SELECT c.id,
                   c.building_id AS buildingId,
                   b.code AS buildingCode,
                   b.name AS buildingName,
                   c.floor_number AS floorNumber,
                   c.room_number AS roomNumber,
                   c.room_name AS roomName,
                   c.room_type AS roomType,
                   c.capacity,
                   c.has_projector AS hasProjector,
                   c.has_ac AS hasAc,
                   c.is_active AS active
            FROM classrooms c
            JOIN buildings b ON c.building_id = b.id
            ORDER BY b.name, c.floor_number, c.room_number
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
            SELECT cls.id,
                   cls.faculty_id AS facultyId,
                   f.code AS facultyCode,
                   f.name AS facultyName,
                   cls.class_code AS classCode,
                   cls.class_name AS className,
                   cls.academic_year_id AS academicYearId,
                   ay.year_label AS academicYear,
                   COUNT(s.id) AS studentCount
            FROM classes cls
            JOIN faculties f ON f.id = cls.faculty_id
            JOIN academic_years ay ON ay.id = cls.academic_year_id
            LEFT JOIN students s
                   ON s.class_id = cls.id
                  AND s.is_deleted = FALSE
            WHERE cls.is_deleted = FALSE
              AND f.is_deleted = FALSE
              AND ay.is_deleted = FALSE
            GROUP BY cls.id,
                     cls.faculty_id,
                     f.code,
                     f.name,
                     cls.class_code,
                     cls.class_name,
                     cls.academic_year_id,
                     ay.year_label
            ORDER BY cls.class_code
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findStudents() {
        String sql = """
            SELECT s.id,
                   s.user_id AS userId,
                   s.faculty_id AS facultyId,
                   f.code AS facultyCode,
                   f.name AS facultyName,
                   s.class_id AS classId,
                   cls.class_code AS classCode,
                   s.student_code AS studentCode,
                   u.full_name AS name,
                   s.class_name AS className,
                   s.course_year AS courseYear,
                   s.phone
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN faculties f ON s.faculty_id = f.id
            JOIN classes cls ON cls.id = s.class_id
            WHERE s.is_deleted = FALSE
              AND u.is_deleted = FALSE
              AND f.is_deleted = FALSE
              AND cls.is_deleted = FALSE
            ORDER BY u.full_name
            """;
        return jdbcTemplate.queryForList(sql);
    }

    private List<Map<String, Object>> findClubs() {
        String sql = """
            SELECT c.id,
                   c.club_code AS clubCode,
                   c.club_name AS clubName,
                   c.faculty_id AS facultyId,
                   f.code AS facultyCode,
                   f.name AS facultyName,
                   c.advisor_user_id AS advisorUserId,
                   u.full_name AS advisorName,
                   c.status
            FROM clubs c
            LEFT JOIN faculties f ON c.faculty_id = f.id
            LEFT JOIN users u ON c.advisor_user_id = u.id
            WHERE c.is_deleted = FALSE
            ORDER BY c.club_name
            """;
        return jdbcTemplate.queryForList(sql);
    }
}
