package com.ptit.qlphonghoc.staff.repository;

import com.ptit.qlphonghoc.staff.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StaffAllocationRepository extends JpaRepository<ClassSection, Integer> {

    @Query(value = """
        SELECT 
            cs.id AS sectionId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            cs.section_code AS sectionCode,
            c.course_name AS courseName,
            cs.enrolled_count AS enrolledCount,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thứ 2' WHEN 'TUE' THEN 'Thứ 3' WHEN 'WED' THEN 'Thứ 4'
                WHEN 'THU' THEN 'Thứ 5' WHEN 'FRI' THEN 'Thứ 6' WHEN 'SAT' THEN 'Thứ 7'
                WHEN 'SUN' THEN 'Chủ nhật' END AS dayOfWeek,
            ts.slot_number AS slotNumber,
            ss.id AS scheduleId,
            CONCAT(b.code, '-', cr.room_number) AS assignedRoom,
            cr.capacity AS roomCapacity,
            ra.id AS allocationId
        FROM class_sections cs
        JOIN courses c ON c.id = cs.course_id
        JOIN section_schedules ss ON ss.section_id = cs.id
        LEFT JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
        LEFT JOIN classrooms cr ON cr.id = ra.classroom_id
        LEFT JOIN buildings b ON b.id = cr.building_id
        LEFT JOIN time_slots ts ON ts.id = ss.time_slot_id
        WHERE cs.semester_id = :semesterId AND cs.status = 'ACTIVE' AND ss.is_active = TRUE
        ORDER BY cs.section_code ASC
        """, nativeQuery = true)
    List<AllocationProjection> findAllSchedulesBySemester(@Param("semesterId") Integer semesterId);

    @Query(value = """
        SELECT ss.id
        FROM section_schedules ss
        JOIN class_sections cs ON cs.id = ss.section_id
        LEFT JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
        WHERE cs.semester_id = :semesterId AND cs.status = 'ACTIVE' AND ss.is_active = TRUE AND ra.id IS NULL
        """, nativeQuery = true)
    List<Integer> findUnassignedScheduleIds(@Param("semesterId") Integer semesterId);

    @Query(value = """
        SELECT cr.id
        FROM classrooms cr
        WHERE cr.is_active = TRUE
          AND cr.room_type = :roomType
          AND cr.capacity >= :maxCapacity
          AND NOT EXISTS (
              SELECT 1 FROM room_allocations ra
              JOIN section_schedules ss2 ON ss2.id = ra.schedule_id
              JOIN class_sections cs2 ON cs2.id = ss2.section_id
              WHERE ra.classroom_id = cr.id AND ra.is_active = TRUE
                AND cs2.semester_id = :semesterId
                AND ss2.day_of_week = :dayOfWeek
                AND ss2.time_slot_id = :timeSlotId
          )
        ORDER BY cr.capacity ASC
        LIMIT 1
        """, nativeQuery = true)
    Optional<Integer> findAvailableRoomForAutoAssign(
            @Param("semesterId") Integer semesterId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId,
            @Param("roomType") String roomType,
            @Param("maxCapacity") Integer maxCapacity
    );

    @Modifying
    @Query(value = """
        INSERT INTO room_allocations (schedule_id, classroom_id, assigned_by, assigned_at, is_active)
        VALUES (:scheduleId, :classroomId, :assignedBy, CURRENT_TIMESTAMP, TRUE)
        ON DUPLICATE KEY UPDATE 
            classroom_id = VALUES(classroom_id),
            assigned_by = VALUES(assigned_by),
            assigned_at = CURRENT_TIMESTAMP,
            is_active = TRUE
        """, nativeQuery = true)
    void upsertRoomAllocation(@Param("scheduleId") Integer scheduleId, @Param("classroomId") Integer classroomId, @Param("assignedBy") Integer assignedBy);

    @Query(value = "SELECT day_of_week FROM section_schedules WHERE id = :scheduleId", nativeQuery = true)
    String getDayOfWeekBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = "SELECT time_slot_id FROM section_schedules WHERE id = :scheduleId", nativeQuery = true)
    Integer getTimeSlotIdBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = "SELECT c.required_room_type FROM courses c JOIN class_sections cs ON cs.course_id = c.id JOIN section_schedules ss ON ss.section_id = cs.id WHERE ss.id = :scheduleId", nativeQuery = true)
    String getRequiredRoomTypeBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = "SELECT cs.max_capacity FROM class_sections cs JOIN section_schedules ss ON ss.section_id = cs.id WHERE ss.id = :scheduleId", nativeQuery = true)
    Integer getMaxCapacityBySchedule(@Param("scheduleId") Integer scheduleId);
    @Query(value = """
        SELECT
            cr.id AS classroomId,
            CONCAT(b.code, '-', cr.room_number) AS roomCode,
            cr.capacity AS capacity,
            cr.room_type AS roomType,
            CASE cr.room_type
                WHEN 'LECTURE' THEN 'Phòng học'
                WHEN 'LAB' THEN 'Phòng máy'
                WHEN 'SEMINAR' THEN 'Phòng seminar'
                WHEN 'AUDITORIUM' THEN 'Hội trường nhỏ'
                ELSE cr.room_type
            END AS roomTypeText,
            CASE cr.room_type
                WHEN 'LAB' THEN 'Máy tính, Máy lạnh'
                WHEN 'SEMINAR' THEN 'Micro, Tivi, Máy lạnh'
                WHEN 'LECTURE' THEN 'Micro, Tivi, Máy lạnh'
                WHEN 'AUDITORIUM' THEN 'Micro, Máy chiếu, Máy lạnh'
                ELSE 'Không có'
            END AS mainEquipment
        FROM classrooms cr
        JOIN buildings b ON b.id = cr.building_id
        WHERE cr.is_active = TRUE
          AND cr.capacity >= :expectedAttendees
          AND (:roomType IS NULL OR :roomType = '' OR cr.room_type = :roomType)
          AND NOT EXISTS (
              SELECT 1 FROM room_allocations ra
              JOIN section_schedules ss ON ss.id = ra.schedule_id
              JOIN class_sections cs ON cs.id = ss.section_id
              WHERE ra.classroom_id = cr.id AND ra.is_active = TRUE
                AND cs.semester_id = :semesterId
                AND ss.day_of_week = :dayOfWeekCode
                AND ss.time_slot_id = :timeSlotId
          )
        ORDER BY cr.capacity ASC
        """, nativeQuery = true)
    List<AllocationRoomProjection> findAvailableRoomsForManualAssign(
            @Param("semesterId") Integer semesterId,
            @Param("dayOfWeekCode") String dayOfWeekCode,
            @Param("timeSlotId") Integer timeSlotId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("roomType") String roomType
    );
    interface AllocationProjection {
        Integer getSectionId();
        String getClassCode();
        String getSectionCode();
        String getCourseName();
        Integer getEnrolledCount();
        Integer getMaxCapacity();
        String getRequiredRoomType();
        String getDayOfWeek();
        Integer getSlotNumber();
        String getAssignedRoom();
        Integer getRoomCapacity();
        Integer getScheduleId();
        Integer getAllocationId();
        
    }
    public interface AllocationRoomProjection {
        Integer getClassroomId();
        String getRoomCode();
        Integer getCapacity();
        String getRoomType();
        String getRoomTypeText();
        String getMainEquipment();
    }
}
