package com.ptit.qlphonghoc.staff.repository;

import com.ptit.qlphonghoc.staff.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StaffTimetableRepository extends JpaRepository<ClassSection, Integer> {

    String SELECT_TIMETABLE = """
        SELECT
            ss.id AS scheduleId,
            cs.id AS sectionId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,

            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thứ 2'
                WHEN 'TUE' THEN 'Thứ 3'
                WHEN 'WED' THEN 'Thứ 4'
                WHEN 'THU' THEN 'Thứ 5'
                WHEN 'FRI' THEN 'Thứ 6'
                WHEN 'SAT' THEN 'Thứ 7'
                WHEN 'SUN' THEN 'Chủ nhật'
            END AS day,

            ss.day_of_week AS dayCode,
            ts.slot_number AS slot,

            CASE ts.slot_number
                WHEN 1 THEN '1-3'
                WHEN 2 THEN '4-6'
                WHEN 3 THEN '7-9'
                WHEN 4 THEN '10-12'
                WHEN 5 THEN '13-15'
                ELSE CAST(ts.slot_number AS CHAR)
            END AS periodText,

            CAST(ts.start_time AS CHAR) AS startTime,
            CAST(ts.end_time AS CHAR) AS endTime,

            cr.id AS classroomId,
            CONCAT(b.code, '-', cr.room_number) AS room,

            ra.id AS allocationId,

            CASE
                WHEN ra.id IS NULL THEN 'UNASSIGNED'
                ELSE 'ASSIGNED'
            END AS allocationStatus,

            CASE
                WHEN ra.id IS NULL THEN 'Chưa phân phòng'
                ELSE 'Đã phân phòng'
            END AS statusText
        """;

    String FROM_TIMETABLE = """
        FROM section_schedules ss
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        LEFT JOIN room_allocations ra
               ON ra.schedule_id = ss.id
              AND ra.is_active = TRUE
        LEFT JOIN classrooms cr ON cr.id = ra.classroom_id
        LEFT JOIN buildings b ON b.id = cr.building_id
        WHERE cs.status = 'ACTIVE'
          AND ss.is_active = TRUE
        """;

    String ORDER_TIMETABLE = """
        ORDER BY
            FIELD(ss.day_of_week, 'MON','TUE','WED','THU','FRI','SAT','SUN'),
            ts.slot_number,
            c.course_code,
            cs.section_code
        """;

    @Query(value = SELECT_TIMETABLE + FROM_TIMETABLE + """
            AND (:semesterId IS NULL OR cs.semester_id = :semesterId)
            AND (:sectionId IS NULL OR cs.id = :sectionId)
            AND (:classroomId IS NULL OR cr.id = :classroomId)
            AND (:dayOfWeek IS NULL OR ss.day_of_week = :dayOfWeek)
            """ + ORDER_TIMETABLE, nativeQuery = true)
    List<TimetableSessionProjection> findTimetable(
            @Param("semesterId") Integer semesterId,
            @Param("sectionId") Integer sectionId,
            @Param("classroomId") Integer classroomId,
            @Param("dayOfWeek") String dayOfWeek
    );

    @Query(value = SELECT_TIMETABLE + FROM_TIMETABLE + """
            AND ss.id = :scheduleId
            """, nativeQuery = true)
    Optional<TimetableSessionProjection> findTimetableByScheduleId(
            @Param("scheduleId") Integer scheduleId
    );

    @Query(value = """
        SELECT
            cr.id AS classroomId,
            CONCAT(b.code, '-', cr.room_number) AS room,
            b.code AS buildingCode,

            ts.slot_number AS slot,

            CASE ts.slot_number
                WHEN 1 THEN '1-3'
                WHEN 2 THEN '4-6'
                WHEN 3 THEN '7-9'
                WHEN 4 THEN '10-12'
                WHEN 5 THEN '13-15'
                ELSE CAST(ts.slot_number AS CHAR)
            END AS periodText,

            occ.dayCode AS dayCode,
            occ.scheduleId AS scheduleId,
            occ.sectionId AS sectionId,
            occ.classCode AS classCode,
            occ.courseName AS courseName,
            occ.lecturerName AS lecturerName,
            occ.statusText AS statusText

        FROM classrooms cr
        JOIN buildings b ON b.id = cr.building_id
        CROSS JOIN time_slots ts

        LEFT JOIN (
            SELECT
                ra.classroom_id AS classroomId,
                ss.time_slot_id AS timeSlotId,
                ss.day_of_week AS dayCode,
                ss.id AS scheduleId,
                cs.id AS sectionId,
                CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
                c.course_name AS courseName,
                l.full_name AS lecturerName,
                'Đã phân phòng' AS statusText
            FROM room_allocations ra
            JOIN section_schedules ss
                 ON ss.id = ra.schedule_id
                AND ss.is_active = TRUE
            JOIN class_sections cs
                 ON cs.id = ss.section_id
                AND cs.status = 'ACTIVE'
            JOIN courses c ON c.id = cs.course_id
            JOIN lecturers l ON l.id = cs.lecturer_id
            WHERE ra.is_active = TRUE
              AND (:semesterId IS NULL OR cs.semester_id = :semesterId)
        ) occ
          ON occ.classroomId = cr.id
         AND occ.timeSlotId = ts.id

        WHERE cr.is_active = TRUE
          AND (:classroomId IS NULL OR cr.id = :classroomId)

        ORDER BY
            b.code,
            cr.room_number,
            ts.slot_number,
            FIELD(occ.dayCode, 'MON','TUE','WED','THU','FRI','SAT','SUN')
        """, nativeQuery = true)
    List<TimetableGridProjection> findTimetableGrid(
            @Param("semesterId") Integer semesterId,
            @Param("classroomId") Integer classroomId
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM class_sections
        WHERE id = :sectionId
          AND status = 'ACTIVE'
        """, nativeQuery = true)
    int countActiveSectionById(@Param("sectionId") Integer sectionId);

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms
        WHERE id = :classroomId
          AND is_active = TRUE
        """, nativeQuery = true)
    int countActiveClassroomById(@Param("classroomId") Integer classroomId);

    @Query(value = """
        SELECT id
        FROM time_slots
        WHERE slot_number = :slotNumber
        """, nativeQuery = true)
    Optional<Integer> findTimeSlotIdBySlotNumber(@Param("slotNumber") Integer slotNumber);

    @Query(value = """
        SELECT COUNT(*)
        FROM section_schedules
        WHERE section_id = :sectionId
          AND is_active = TRUE
        """, nativeQuery = true)
    int countActiveSchedulesBySectionId(@Param("sectionId") Integer sectionId);

    @Query(value = """
        SELECT COUNT(*)
        FROM section_schedules
        WHERE section_id = :sectionId
          AND is_active = TRUE
          AND id <> :scheduleId
        """, nativeQuery = true)
    int countActiveSchedulesBySectionIdExceptSchedule(
            @Param("sectionId") Integer sectionId,
            @Param("scheduleId") Integer scheduleId
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM section_schedules
        WHERE id = :scheduleId
          AND is_active = TRUE
        """, nativeQuery = true)
    int countActiveScheduleById(@Param("scheduleId") Integer scheduleId);

    @Query(value = """
        SELECT id
        FROM section_schedules
        WHERE section_id = :sectionId
          AND day_of_week = :dayOfWeek
          AND time_slot_id = :timeSlotId
        LIMIT 1
        """, nativeQuery = true)
    Optional<Integer> findScheduleId(
            @Param("sectionId") Integer sectionId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId
    );

    @Modifying
    @Query(value = """
        INSERT INTO section_schedules(
            section_id,
            day_of_week,
            time_slot_id,
            is_active
        )
        VALUES (
            :sectionId,
            :dayOfWeek,
            :timeSlotId,
            TRUE
        )
        """, nativeQuery = true)
    void insertSchedule(
            @Param("sectionId") Integer sectionId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId
    );

    @Modifying
    @Query(value = """
        UPDATE section_schedules
        SET section_id = :sectionId,
            day_of_week = :dayOfWeek,
            time_slot_id = :timeSlotId,
            is_active = TRUE
        WHERE id = :scheduleId
        """, nativeQuery = true)
    void updateSchedule(
            @Param("scheduleId") Integer scheduleId,
            @Param("sectionId") Integer sectionId,
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
        UPDATE room_allocations
        SET is_active = FALSE
        WHERE schedule_id = :scheduleId
        """, nativeQuery = true)
    void deactivateRoomAllocationByScheduleId(@Param("scheduleId") Integer scheduleId);

    @Modifying
    @Query(value = """
        UPDATE section_schedules
        SET is_active = FALSE
        WHERE id = :scheduleId
        """, nativeQuery = true)
    void deactivateScheduleById(@Param("scheduleId") Integer scheduleId);

    interface TimetableSessionProjection {
        Integer getScheduleId();

        Integer getSectionId();

        String getClassCode();

        String getCourseName();

        String getLecturerName();

        String getDay();

        String getDayCode();

        Integer getSlot();

        String getPeriodText();

        String getStartTime();

        String getEndTime();

        Integer getClassroomId();

        String getRoom();

        Integer getAllocationId();

        String getAllocationStatus();

        String getStatusText();
    }

    interface TimetableGridProjection {
        Integer getClassroomId();

        String getRoom();

        String getBuildingCode();

        Integer getSlot();

        String getPeriodText();

        String getDayCode();

        Integer getScheduleId();

        Integer getSectionId();

        String getClassCode();

        String getCourseName();

        String getLecturerName();

        String getStatusText();
    }
}