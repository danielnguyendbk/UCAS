package com.ptit.qlphonghoc.staff.repository;

import com.ptit.qlphonghoc.staff.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassSectionRepository extends JpaRepository<ClassSection, Integer> {

    String TABLE_SELECT = """
        SELECT
            cs.id AS id,
            cs.semester_id AS semesterId,
            cs.course_id AS courseId,
            cs.lecturer_id AS lecturerId,
            cs.max_capacity AS maxCapacity,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            f.code AS facultyCode,
            d.code AS departmentCode,
            c.credits AS credits,
            cs.enrolled_count AS studentCount,
            l.full_name AS lecturerName,

            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thứ 2'
                WHEN 'TUE' THEN 'Thứ 3'
                WHEN 'WED' THEN 'Thứ 4'
                WHEN 'THU' THEN 'Thứ 5'
                WHEN 'FRI' THEN 'Thứ 6'
                WHEN 'SAT' THEN 'Thứ 7'
                WHEN 'SUN' THEN 'Chủ nhật'
                ELSE '-'
            END AS day,

            ss.day_of_week AS dayCode,
            ts.slot_number AS slot,

            CASE
                WHEN ss.id IS NULL THEN '-'
                ELSE CONCAT(
                    CASE ss.day_of_week
                        WHEN 'MON' THEN 'Thứ 2'
                        WHEN 'TUE' THEN 'Thứ 3'
                        WHEN 'WED' THEN 'Thứ 4'
                        WHEN 'THU' THEN 'Thứ 5'
                        WHEN 'FRI' THEN 'Thứ 6'
                        WHEN 'SAT' THEN 'Thứ 7'
                        WHEN 'SUN' THEN 'Chủ nhật'
                    END,
                    ' - Tiết ',
                    CASE ts.slot_number
                        WHEN 1 THEN '1-3'
                        WHEN 2 THEN '4-6'
                        WHEN 3 THEN '7-9'
                        WHEN 4 THEN '10-12'
                        WHEN 5 THEN '13-15'
                        ELSE CAST(ts.slot_number AS CHAR)
                    END
                )
            END AS schedule,

            cr.id AS classroomId,
            CONCAT(b.code, '-', cr.room_number) AS room,

            CASE
                WHEN ss.id IS NULL THEN 'NO_SCHEDULE'
                WHEN ra.id IS NULL THEN 'UNASSIGNED'
                WHEN EXISTS (
                    SELECT 1
                    FROM room_allocations ra2
                    JOIN section_schedules ss2 ON ss2.id = ra2.schedule_id
                    JOIN class_sections cs2 ON cs2.id = ss2.section_id
                    WHERE ra2.is_active = TRUE
                      AND cs2.status <> 'CANCELLED'
                      AND ra2.classroom_id = ra.classroom_id
                      AND ss2.day_of_week = ss.day_of_week
                      AND ss2.time_slot_id = ss.time_slot_id
                      AND ss2.id <> ss.id
                ) THEN 'CONFLICT'
                ELSE 'ASSIGNED'
            END AS allocationStatus,

            CASE
                WHEN ss.id IS NULL THEN 'Chưa có lịch'
                WHEN ra.id IS NULL THEN 'Chưa phân phòng'
                WHEN EXISTS (
                    SELECT 1
                    FROM room_allocations ra2
                    JOIN section_schedules ss2 ON ss2.id = ra2.schedule_id
                    JOIN class_sections cs2 ON cs2.id = ss2.section_id
                    WHERE ra2.is_active = TRUE
                      AND cs2.status <> 'CANCELLED'
                      AND ra2.classroom_id = ra.classroom_id
                      AND ss2.day_of_week = ss.day_of_week
                      AND ss2.time_slot_id = ss.time_slot_id
                      AND ss2.id <> ss.id
                ) THEN 'Xung đột lịch'
                ELSE 'Đã phân phòng'
            END AS statusText,

            cs.status AS sectionStatus
        """;

    String TABLE_FROM = """
        FROM class_sections cs
        JOIN courses c ON c.id = cs.course_id
        JOIN departments d ON d.id = c.department_id
        JOIN faculties f ON f.id = d.faculty_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        LEFT JOIN section_schedules ss
                ON ss.section_id = cs.id
                AND ss.is_active = TRUE
        LEFT JOIN time_slots ts ON ts.id = ss.time_slot_id
        LEFT JOIN room_allocations ra
               ON ra.schedule_id = ss.id
              AND ra.is_active = TRUE
        LEFT JOIN classrooms cr ON cr.id = ra.classroom_id
        LEFT JOIN buildings b ON b.id = cr.building_id
        WHERE cs.status <> 'CANCELLED'
        """;

    String TABLE_ORDER = """
        ORDER BY c.course_code, cs.section_code
        """;
    
    @Query(value = TABLE_SELECT + TABLE_FROM + """
            AND (:semesterId IS NULL OR cs.semester_id = :semesterId)
            """ + TABLE_ORDER, nativeQuery = true)
    List<StaffSectionTableProjection> findStaffTable(@Param("semesterId") Integer semesterId);

    @Query(value = TABLE_SELECT + TABLE_FROM + """
            AND cs.id = :id
            """ + TABLE_ORDER, nativeQuery = true)
    Optional<StaffSectionTableProjection> findStaffTableById(@Param("id") Integer id);
    
    @Query(value = """
        SELECT id
        FROM time_slots
        WHERE slot_number = :slotNumber
        """, nativeQuery = true)
    Optional<Integer> findTimeSlotIdBySlotNumber(@Param("slotNumber") Integer slotNumber);

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms
        WHERE id = :classroomId
          AND is_active = TRUE
        """, nativeQuery = true)
    int countActiveClassroomById(@Param("classroomId") Integer classroomId);

    @Query(value = """
        SELECT id
        FROM section_schedules
        WHERE section_id = :sectionId
        LIMIT 1
        """, nativeQuery = true)
    Optional<Integer> findScheduleIdBySectionId(@Param("sectionId") Integer sectionId);

    @Modifying
    @Query(value = """
        INSERT INTO section_schedules(section_id, day_of_week, time_slot_id)
        VALUES (:sectionId, :dayOfWeek, :timeSlotId)
        """, nativeQuery = true)
    void insertSchedule(
            @Param("sectionId") Integer sectionId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId
    );

    @Modifying
    @Query(value = """
        UPDATE section_schedules
        SET day_of_week = :dayOfWeek,
            time_slot_id = :timeSlotId
        WHERE id = :scheduleId
        """, nativeQuery = true)
    void updateScheduleById(
            @Param("scheduleId") Integer scheduleId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId
    );

    @Modifying
    @Query(value = """
        INSERT INTO room_allocations(
            schedule_id,
            classroom_id,
            assigned_by,
            assigned_at,
            is_active,
            note
        )
        VALUES (
            :scheduleId,
            :classroomId,
            :assignedBy,
            CURRENT_TIMESTAMP,
            TRUE,
            :note
        )
        ON DUPLICATE KEY UPDATE
            classroom_id = VALUES(classroom_id),
            assigned_by = VALUES(assigned_by),
            assigned_at = CURRENT_TIMESTAMP,
            is_active = TRUE,
            note = VALUES(note)
        """, nativeQuery = true)
    void upsertRoomAllocation(
            @Param("scheduleId") Integer scheduleId,
            @Param("classroomId") Integer classroomId,
            @Param("assignedBy") Integer assignedBy,
            @Param("note") String note
    );

    @Modifying
    @Query(value = """
        UPDATE room_allocations ra
        JOIN section_schedules ss ON ss.id = ra.schedule_id
        SET ra.is_active = FALSE
        WHERE ss.section_id = :sectionId
        """, nativeQuery = true)
    void deactivateRoomAllocationsOfSection(@Param("sectionId") Integer sectionId);

    @Modifying
    @Query(value = """
        UPDATE section_schedules
        SET is_active = FALSE
        WHERE section_id = :sectionId
        """, nativeQuery = true)
    void deactivateSchedulesOfSection(@Param("sectionId") Integer sectionId);

    // THÊM TRUY VẤN TÌM TRẠNG THÁI HỌC KỲ
    @Query(value = "SELECT status FROM semesters WHERE id = :semesterId", nativeQuery = true)
    String findSemesterStatus(@Param("semesterId") Integer semesterId);

    interface StaffSectionTableProjection {
        Integer getId();
        String getClassCode();
        String getCourseName();
        String getFacultyCode();
        
        String getDepartmentCode();
        Integer getSemesterId();
        Integer getCourseId();
        Integer getLecturerId();
        Integer getMaxCapacity();
        Integer getCredits();
        Integer getStudentCount();
        String getLecturerName();
        String getDay();
        String getDayCode();
        Integer getSlot();
        String getSchedule();
        Integer getClassroomId();
        String getRoom();
        String getAllocationStatus();
        String getStatusText();
        String getSectionStatus();
    }
}
