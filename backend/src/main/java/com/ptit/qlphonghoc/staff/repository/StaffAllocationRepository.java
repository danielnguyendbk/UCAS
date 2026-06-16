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
            cs.section_id AS sectionId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            cs.section_code AS sectionCode,
            c.course_name AS courseName,
            cs.enrolled_count AS enrolledCount,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType,
            CASE sch.day_of_week
                WHEN 'MON' THEN 'Thu 2' WHEN 'TUE' THEN 'Thu 3' WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5' WHEN 'FRI' THEN 'Thu 6' WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat' END AS dayOfWeek,
            ts_start.slot_no AS slotNumber,
            sch.schedule_id AS scheduleId,
            CASE
                WHEN cr.classroom_id IS NULL THEN NULL
                ELSE CONCAT(b.building_code, '-', cr.room_number)
            END AS assignedRoom,
            cr.capacity AS roomCapacity,
            sch.classroom_id AS allocationId
        FROM class_sections cs
        JOIN courses c ON c.course_id = cs.course_id
        JOIN schedules sch ON sch.section_id = cs.section_id
        JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
        LEFT JOIN classrooms cr ON cr.classroom_id = sch.classroom_id
        LEFT JOIN buildings b ON b.building_id = cr.building_id
        WHERE cs.semester_id = :semesterId
          AND cs.status = 'ACTIVE'
          AND sch.status <> 'CANCELLED'
        ORDER BY cs.section_code ASC
        """, nativeQuery = true)
    List<AllocationProjection> findAllSchedulesBySemester(@Param("semesterId") Integer semesterId);

    @Query(value = """
        SELECT sch.schedule_id
        FROM schedules sch
        JOIN class_sections cs ON cs.section_id = sch.section_id
        WHERE cs.semester_id = :semesterId
          AND cs.status = 'ACTIVE'
          AND sch.status = 'UNASSIGNED'
          AND sch.classroom_id IS NULL
        """, nativeQuery = true)
    List<Integer> findUnassignedScheduleIds(@Param("semesterId") Integer semesterId);

    @Query(value = """
        SELECT cr.classroom_id
        FROM classrooms cr
        WHERE cr.is_active = TRUE
          AND cr.is_deleted = FALSE
          AND cr.room_type = :roomType
          AND cr.capacity >= :maxCapacity
          AND NOT EXISTS (
              SELECT 1
              FROM schedules sch2
              JOIN class_sections cs2 ON cs2.section_id = sch2.section_id
              WHERE sch2.classroom_id = cr.classroom_id
                AND sch2.status = 'ASSIGNED'
                AND cs2.status = 'ACTIVE'
                AND cs2.semester_id = :semesterId
                AND sch2.day_of_week = :dayOfWeek
                AND sch2.slot_start_id <= :slotEndId
                AND sch2.slot_end_id >= :slotStartId
          )
        ORDER BY cr.capacity ASC
        LIMIT 1
        """, nativeQuery = true)
    Optional<Integer> findAvailableRoomForAutoAssign(
            @Param("semesterId") Integer semesterId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("roomType") String roomType,
            @Param("maxCapacity") Integer maxCapacity
    );

    @Modifying
    @Query(value = """
        UPDATE schedules
        SET classroom_id = :classroomId,
            assigned_by = :assignedBy,
            assigned_at = CURRENT_TIMESTAMP,
            status = 'ASSIGNED'
        WHERE schedule_id = :scheduleId
          AND status <> 'CANCELLED'
        """, nativeQuery = true)
    void upsertRoomAllocation(
            @Param("scheduleId") Integer scheduleId,
            @Param("classroomId") Integer classroomId,
            @Param("assignedBy") Integer assignedBy
    );

    @Query(value = "SELECT day_of_week FROM schedules WHERE schedule_id = :scheduleId", nativeQuery = true)
    String getDayOfWeekBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = "SELECT slot_start_id FROM schedules WHERE schedule_id = :scheduleId", nativeQuery = true)
    Integer getSlotStartIdBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = "SELECT slot_end_id FROM schedules WHERE schedule_id = :scheduleId", nativeQuery = true)
    Integer getSlotEndIdBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = """
        SELECT c.required_room_type
        FROM courses c
        JOIN class_sections cs ON cs.course_id = c.course_id
        JOIN schedules sch ON sch.section_id = cs.section_id
        WHERE sch.schedule_id = :scheduleId
        """, nativeQuery = true)
    String getRequiredRoomTypeBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = """
        SELECT cs.max_capacity
        FROM class_sections cs
        JOIN schedules sch ON sch.section_id = cs.section_id
        WHERE sch.schedule_id = :scheduleId
        """, nativeQuery = true)
    Integer getMaxCapacityBySchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = """
        SELECT
            cr.classroom_id AS classroomId,
            CONCAT(b.building_code, '-', cr.room_number) AS roomCode,
            cr.capacity AS capacity,
            cr.room_type AS roomType,
            CASE cr.room_type
                WHEN 'LECTURE' THEN 'Phong hoc'
                WHEN 'LAB' THEN 'Phong may'
                WHEN 'SEMINAR' THEN 'Phong seminar'
                WHEN 'AUDITORIUM' THEN 'Hoi truong nho'
                ELSE cr.room_type
            END AS roomTypeText,
            CASE cr.room_type
                WHEN 'LAB' THEN 'May tinh, May lanh'
                WHEN 'SEMINAR' THEN 'Micro, Tivi, May lanh'
                WHEN 'LECTURE' THEN 'Micro, Tivi, May lanh'
                WHEN 'AUDITORIUM' THEN 'Micro, May chieu, May lanh'
                ELSE 'Khong co'
            END AS mainEquipment
        FROM classrooms cr
        JOIN buildings b ON b.building_id = cr.building_id
        WHERE cr.is_active = TRUE
          AND cr.is_deleted = FALSE
          AND cr.capacity >= :expectedAttendees
          AND (:roomType IS NULL OR :roomType = '' OR cr.room_type = :roomType)
          AND NOT EXISTS (
              SELECT 1
              FROM schedules sch
              JOIN class_sections cs ON cs.section_id = sch.section_id
              WHERE sch.classroom_id = cr.classroom_id
                AND sch.status = 'ASSIGNED'
                AND cs.status = 'ACTIVE'
                AND cs.semester_id = :semesterId
                AND sch.day_of_week = :dayOfWeekCode
                AND sch.slot_start_id <= :slotEndId
                AND sch.slot_end_id >= :slotStartId
          )
        ORDER BY cr.capacity ASC
        """, nativeQuery = true)
    List<AllocationRoomProjection> findAvailableRoomsForManualAssign(
            @Param("semesterId") Integer semesterId,
            @Param("dayOfWeekCode") String dayOfWeekCode,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
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

    interface AllocationRoomProjection {
        Integer getClassroomId();
        String getRoomCode();
        Integer getCapacity();
        String getRoomType();
        String getRoomTypeText();
        String getMainEquipment();
    }
}
