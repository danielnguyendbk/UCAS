package com.ptit.qlphonghoc.staff.repository;

import com.ptit.qlphonghoc.staff.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface StaffAllocationRepository extends JpaRepository<ClassSection, Integer> {

    @Query(value = """
        SELECT
            cs.section_id AS sectionId,
            cs.semester_id AS semesterId,
            cs.lecturer_id AS lecturerId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            cs.section_code AS sectionCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            cs.enrolled_count AS enrolledCount,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType,
            CASE sch.day_of_week
                WHEN 'MON' THEN 'Thu 2' WHEN 'TUE' THEN 'Thu 3' WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5' WHEN 'FRI' THEN 'Thu 6' WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat' END AS dayOfWeek,
            sch.day_of_week AS dayOfWeekCode,
            sch.slot_start_id AS slotStartId,
            sch.slot_end_id AS slotEndId,
            ts_start.slot_no AS slotNumber,
            ts_end.slot_no AS slotEndNumber,
            sch.start_time AS startTime,
            sch.end_time AS endTime,
            sch.from_week_no AS fromWeekNo,
            sch.to_week_no AS toWeekNo,
            sch.schedule_id AS scheduleId,
            sch.status AS scheduleStatus,
            sch.validation_status AS validationStatus,
            sch.conflict_reason AS conflictReason,
            CASE
                WHEN cr.classroom_id IS NULL THEN NULL
                ELSE CONCAT(b.building_code, '-', cr.room_number)
            END AS assignedRoom,
            cr.capacity AS roomCapacity,
            cr.room_type AS assignedRoomType,
            cr.is_active AS roomActive,
            cr.is_deleted AS roomDeleted,
            sch.classroom_id AS allocationId
        FROM class_sections cs
        JOIN courses c ON c.course_id = cs.course_id
        JOIN lecturers l ON l.lecturer_id = cs.lecturer_id
        JOIN schedules sch ON sch.section_id = cs.section_id
        JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
        JOIN time_slots ts_end ON ts_end.slot_id = sch.slot_end_id
        LEFT JOIN classrooms cr ON cr.classroom_id = sch.classroom_id
        LEFT JOIN buildings b ON b.building_id = cr.building_id
        WHERE cs.semester_id = :semesterId
          AND cs.status = 'ACTIVE'
          AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
        ORDER BY cs.section_code ASC
        """, nativeQuery = true)
    List<AllocationProjection> findAllSchedulesBySemester(@Param("semesterId") Integer semesterId);

    @Query(value = "SELECT schedule_id FROM schedules WHERE schedule_id = :scheduleId FOR UPDATE", nativeQuery = true)
    Optional<Integer> lockSchedule(@Param("scheduleId") Integer scheduleId);

    @Query(value = "SELECT classroom_id FROM classrooms WHERE classroom_id = :classroomId FOR UPDATE", nativeQuery = true)
    Optional<Integer> lockClassroom(@Param("classroomId") Integer classroomId);

    @Query(value = """
        SELECT
            sch.schedule_id AS scheduleId,
            cs.semester_id AS semesterId,
            cs.section_id AS sectionId,
            cs.status AS sectionStatus,
            sch.status AS scheduleStatus,
            sch.day_of_week AS dayOfWeekCode,
            sch.slot_start_id AS slotStartId,
            sch.slot_end_id AS slotEndId,
            ts_start.slot_no AS slotStartNumber,
            ts_end.slot_no AS slotEndNumber,
            sch.start_time AS startTime,
            sch.end_time AS endTime,
            sch.from_week_no AS fromWeekNo,
            sch.to_week_no AS toWeekNo,
            cs.enrolled_count AS enrolledCount,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType
        FROM schedules sch
        JOIN class_sections cs ON cs.section_id = sch.section_id
        JOIN courses c ON c.course_id = cs.course_id
        JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
        JOIN time_slots ts_end ON ts_end.slot_id = sch.slot_end_id
        WHERE sch.schedule_id = :scheduleId
        """, nativeQuery = true)
    Optional<AssignmentScheduleProjection> findScheduleForAssignment(@Param("scheduleId") Integer scheduleId);

    @Query(value = """
        SELECT
            cr.classroom_id AS classroomId,
            CONCAT(b.building_code, '-', cr.room_number) AS roomCode,
            cr.room_type AS roomType,
            cr.capacity AS capacity,
            cr.is_active AS active,
            cr.is_deleted AS deleted
        FROM classrooms cr
        JOIN buildings b ON b.building_id = cr.building_id
        WHERE cr.classroom_id = :classroomId
        """, nativeQuery = true)
    Optional<AssignmentRoomProjection> findRoomForAssignment(@Param("classroomId") Integer classroomId);

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
                AND COALESCE(sch2.from_week_no, 1) <= COALESCE(:toWeekNo, 999)
                AND COALESCE(:fromWeekNo, 1) <= COALESCE(sch2.to_week_no, 999)
                AND sch2.schedule_id <> :scheduleId
          )
        ORDER BY cr.capacity ASC
        LIMIT 1
        """, nativeQuery = true)
    Optional<Integer> findAvailableRoomForAutoAssign(
            @Param("semesterId") Integer semesterId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("fromWeekNo") Integer fromWeekNo,
            @Param("toWeekNo") Integer toWeekNo,
            @Param("scheduleId") Integer scheduleId,
            @Param("roomType") String roomType,
            @Param("maxCapacity") Integer maxCapacity
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM schedules sch2
        JOIN class_sections cs2 ON cs2.section_id = sch2.section_id
        WHERE sch2.classroom_id = :classroomId
          AND sch2.schedule_id <> :scheduleId
          AND sch2.status = 'ASSIGNED'
          AND cs2.status = 'ACTIVE'
          AND cs2.semester_id = :semesterId
          AND sch2.day_of_week = :dayOfWeek
          AND sch2.slot_start_id <= :slotEndId
          AND sch2.slot_end_id >= :slotStartId
          AND COALESCE(sch2.from_week_no, 1) <= COALESCE(:toWeekNo, 999)
          AND COALESCE(:fromWeekNo, 1) <= COALESCE(sch2.to_week_no, 999)
        """, nativeQuery = true)
    int countRoomTimeConflicts(
            @Param("scheduleId") Integer scheduleId,
            @Param("classroomId") Integer classroomId,
            @Param("semesterId") Integer semesterId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("fromWeekNo") Integer fromWeekNo,
            @Param("toWeekNo") Integer toWeekNo
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM schedules sch
        JOIN class_sections cs ON cs.section_id = sch.section_id
        JOIN semester_weeks sw
          ON sw.semester_id = cs.semester_id
         AND sw.week_no BETWEEN COALESCE(sch.from_week_no, 1) AND COALESCE(sch.to_week_no, 999)
        JOIN academic_calendar_blocks acb
          ON acb.semester_id = cs.semester_id
         AND acb.is_teaching_allowed = FALSE
        WHERE sch.schedule_id = :scheduleId
          AND DATE_ADD(
                sw.start_date,
                INTERVAL MOD(
                    (CASE sch.day_of_week
                        WHEN 'MON' THEN 0 WHEN 'TUE' THEN 1 WHEN 'WED' THEN 2
                        WHEN 'THU' THEN 3 WHEN 'FRI' THEN 4 WHEN 'SAT' THEN 5
                        WHEN 'SUN' THEN 6 END) - WEEKDAY(sw.start_date) + 7,
                    7
                ) DAY
              ) <= sw.end_date
          AND DATE_ADD(
                sw.start_date,
                INTERVAL MOD(
                    (CASE sch.day_of_week
                        WHEN 'MON' THEN 0 WHEN 'TUE' THEN 1 WHEN 'WED' THEN 2
                        WHEN 'THU' THEN 3 WHEN 'FRI' THEN 4 WHEN 'SAT' THEN 5
                        WHEN 'SUN' THEN 6 END) - WEEKDAY(sw.start_date) + 7,
                    7
                ) DAY
              ) BETWEEN acb.start_date AND acb.end_date
        """, nativeQuery = true)
    int countCalendarBlockConflicts(@Param("scheduleId") Integer scheduleId);

    @Query(value = """
        SELECT DISTINCT
            sch.schedule_id AS scheduleId,
            acb.title AS blockTitle,
            acb.block_type AS blockType,
            DATE_ADD(
                sw.start_date,
                INTERVAL MOD(
                    (CASE sch.day_of_week
                        WHEN 'MON' THEN 0 WHEN 'TUE' THEN 1 WHEN 'WED' THEN 2
                        WHEN 'THU' THEN 3 WHEN 'FRI' THEN 4 WHEN 'SAT' THEN 5
                        WHEN 'SUN' THEN 6 END) - WEEKDAY(sw.start_date) + 7,
                    7
                ) DAY
            ) AS teachingDate
        FROM schedules sch
        JOIN class_sections cs ON cs.section_id = sch.section_id
        JOIN semester_weeks sw
          ON sw.semester_id = cs.semester_id
         AND sw.week_no BETWEEN COALESCE(sch.from_week_no, 1) AND COALESCE(sch.to_week_no, 999)
        JOIN academic_calendar_blocks acb
          ON acb.semester_id = cs.semester_id
         AND acb.is_teaching_allowed = FALSE
        WHERE cs.semester_id = :semesterId
          AND cs.status = 'ACTIVE'
          AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
          AND DATE_ADD(
                sw.start_date,
                INTERVAL MOD(
                    (CASE sch.day_of_week
                        WHEN 'MON' THEN 0 WHEN 'TUE' THEN 1 WHEN 'WED' THEN 2
                        WHEN 'THU' THEN 3 WHEN 'FRI' THEN 4 WHEN 'SAT' THEN 5
                        WHEN 'SUN' THEN 6 END) - WEEKDAY(sw.start_date) + 7,
                    7
                ) DAY
              ) <= sw.end_date
          AND DATE_ADD(
                sw.start_date,
                INTERVAL MOD(
                    (CASE sch.day_of_week
                        WHEN 'MON' THEN 0 WHEN 'TUE' THEN 1 WHEN 'WED' THEN 2
                        WHEN 'THU' THEN 3 WHEN 'FRI' THEN 4 WHEN 'SAT' THEN 5
                        WHEN 'SUN' THEN 6 END) - WEEKDAY(sw.start_date) + 7,
                    7
                ) DAY
              ) BETWEEN acb.start_date AND acb.end_date
        """, nativeQuery = true)
    List<CalendarBlockConflictProjection> findCalendarBlockConflicts(@Param("semesterId") Integer semesterId);

    @Query(value = """
        SELECT MIN(week_no) AS minWeekNo, MAX(week_no) AS maxWeekNo
        FROM semester_weeks
        WHERE semester_id = :semesterId
        """, nativeQuery = true)
    WeekBoundsProjection findWeekBounds(@Param("semesterId") Integer semesterId);

    @Modifying
    @Query(value = """
        UPDATE schedules
        SET classroom_id = :classroomId,
            assigned_by = :assignedBy,
            assigned_at = CURRENT_TIMESTAMP,
            status = 'ASSIGNED',
            validation_status = 'NOT_CHECKED',
            conflict_reason = NULL
        WHERE schedule_id = :scheduleId
          AND status NOT IN ('CANCELLED', 'INACTIVE')
        """, nativeQuery = true)
    int upsertRoomAllocation(
            @Param("scheduleId") Integer scheduleId,
            @Param("classroomId") Integer classroomId,
            @Param("assignedBy") Integer assignedBy
    );

    @Modifying
    @Query(value = """
        UPDATE schedules sch
        JOIN class_sections cs ON cs.section_id = sch.section_id
        SET sch.validation_status = 'VALID', sch.conflict_reason = NULL
        WHERE cs.semester_id = :semesterId
          AND cs.status = 'ACTIVE'
          AND sch.status NOT IN ('CANCELLED', 'INACTIVE')
        """, nativeQuery = true)
    int markSchedulesValid(@Param("semesterId") Integer semesterId);

    @Modifying
    @Query(value = """
        UPDATE schedules
        SET validation_status = 'CONFLICT', conflict_reason = :conflictReason
        WHERE schedule_id = :scheduleId
        """, nativeQuery = true)
    int markScheduleConflict(
            @Param("scheduleId") Integer scheduleId,
            @Param("conflictReason") String conflictReason
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
            cr.building_id AS buildingId,
            b.building_code AS buildingCode,
            b.building_name AS buildingName,
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
          AND (:buildingId IS NULL OR cr.building_id = :buildingId)
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
                AND COALESCE(sch.from_week_no, 1) <= COALESCE(:toWeekNo, 999)
                AND COALESCE(:fromWeekNo, 1) <= COALESCE(sch.to_week_no, 999)
                AND (:excludedScheduleId IS NULL OR sch.schedule_id <> :excludedScheduleId)
          )
        ORDER BY cr.capacity ASC
        """, nativeQuery = true)
    List<AllocationRoomProjection> findAvailableRoomsForManualAssign(
            @Param("semesterId") Integer semesterId,
            @Param("dayOfWeekCode") String dayOfWeekCode,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("fromWeekNo") Integer fromWeekNo,
            @Param("toWeekNo") Integer toWeekNo,
            @Param("excludedScheduleId") Integer excludedScheduleId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("roomType") String roomType,
            @Param("buildingId") Integer buildingId
    );

    interface AllocationProjection {
        Integer getSectionId();
        Integer getSemesterId();
        Integer getLecturerId();
        String getClassCode();
        String getSectionCode();
        String getCourseName();
        String getLecturerName();
        Integer getEnrolledCount();
        Integer getMaxCapacity();
        String getRequiredRoomType();
        String getDayOfWeek();
        String getDayOfWeekCode();
        Integer getSlotStartId();
        Integer getSlotEndId();
        Integer getSlotNumber();
        Integer getSlotEndNumber();
        LocalTime getStartTime();
        LocalTime getEndTime();
        Integer getFromWeekNo();
        Integer getToWeekNo();
        String getAssignedRoom();
        Integer getRoomCapacity();
        String getAssignedRoomType();
        Boolean getRoomActive();
        Boolean getRoomDeleted();
        String getScheduleStatus();
        String getValidationStatus();
        String getConflictReason();
        Integer getScheduleId();
        Integer getAllocationId();
    }

    interface AssignmentScheduleProjection {
        Integer getScheduleId();
        Integer getSemesterId();
        Integer getSectionId();
        String getSectionStatus();
        String getScheduleStatus();
        String getDayOfWeekCode();
        Integer getSlotStartId();
        Integer getSlotEndId();
        Integer getSlotStartNumber();
        Integer getSlotEndNumber();
        LocalTime getStartTime();
        LocalTime getEndTime();
        Integer getFromWeekNo();
        Integer getToWeekNo();
        Integer getEnrolledCount();
        Integer getMaxCapacity();
        String getRequiredRoomType();
    }

    interface AssignmentRoomProjection {
        Integer getClassroomId();
        String getRoomCode();
        String getRoomType();
        Integer getCapacity();
        Boolean getActive();
        Boolean getDeleted();
    }

    interface CalendarBlockConflictProjection {
        Integer getScheduleId();
        String getBlockTitle();
        String getBlockType();
        LocalDate getTeachingDate();
    }

    interface WeekBoundsProjection {
        Integer getMinWeekNo();
        Integer getMaxWeekNo();
    }

    interface AllocationRoomProjection {
        Integer getClassroomId();
        Integer getBuildingId();
        String getBuildingCode();
        String getBuildingName();
        String getRoomCode();
        Integer getCapacity();
        String getRoomType();
        String getRoomTypeText();
        String getMainEquipment();
    }
}
