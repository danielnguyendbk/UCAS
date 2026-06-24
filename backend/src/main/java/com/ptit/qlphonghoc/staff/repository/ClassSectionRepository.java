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
            cs.section_id AS id,
            cs.semester_id AS semesterId,
            cs.course_id AS courseId,
            cs.lecturer_id AS lecturerId,
            cs.max_capacity AS maxCapacity,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            NULL AS facultyCode,
            d.department_code AS departmentCode,
            c.credits AS credits,
            cs.enrolled_count AS studentCount,
            l.full_name AS lecturerName,

            CASE sch.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
                ELSE '-'
            END AS day,

            sch.day_of_week AS dayCode,
            sch.slot_start_id AS slotStartId,
            sch.slot_end_id AS slotEndId,
            ts_start.slot_no AS slot,
            ts_start.slot_no AS slotStart,
            ts_end.slot_no AS slotEnd,
            sch.from_week_no AS fromWeekNo,
            sch.to_week_no AS toWeekNo,

            CASE
                WHEN sch.schedule_id IS NULL THEN '-'
                ELSE CONCAT(
                    CASE sch.day_of_week
                        WHEN 'MON' THEN 'Thu 2'
                        WHEN 'TUE' THEN 'Thu 3'
                        WHEN 'WED' THEN 'Thu 4'
                        WHEN 'THU' THEN 'Thu 5'
                        WHEN 'FRI' THEN 'Thu 6'
                        WHEN 'SAT' THEN 'Thu 7'
                        WHEN 'SUN' THEN 'Chu nhat'
                    END,
                    ' - Tiet ',
                    ts_start.slot_no,
                    '-',
                    ts_end.slot_no
                )
            END AS schedule,

            cr.classroom_id AS classroomId,
            CASE
                WHEN cr.classroom_id IS NULL THEN NULL
                ELSE CONCAT(b.building_code, '-', cr.room_number)
            END AS room,
            CASE
                WHEN cr.classroom_id IS NULL THEN NULL
                ELSE CONCAT(b.building_code, '-', cr.room_number)
            END AS classroomCode,

            sch.status AS scheduleStatus,
            sch.validation_status AS validationStatus,
            sch.conflict_reason AS conflictReason,

            CASE
                WHEN sch.schedule_id IS NULL THEN 'NO_SCHEDULE'
                WHEN sch.status = 'UNASSIGNED' OR sch.classroom_id IS NULL THEN 'UNASSIGNED'
                WHEN sch.validation_status = 'CONFLICT' THEN 'CONFLICT'
                ELSE 'ASSIGNED'
            END AS allocationStatus,

            CASE
                WHEN sch.schedule_id IS NULL THEN 'Chua co lich'
                WHEN sch.status = 'UNASSIGNED' OR sch.classroom_id IS NULL THEN 'Chua phan phong'
                WHEN sch.validation_status = 'CONFLICT' THEN 'Xung dot lich'
                ELSE 'Da phan phong'
            END AS statusText,

            cs.status AS sectionStatus,
            NULL AS classIds,
            cs.class_name AS classCodes,
            cs.class_name AS classNames
        """;

    String TABLE_FROM = """
        FROM class_sections cs
        JOIN courses c ON c.course_id = cs.course_id
        JOIN departments d ON d.department_id = c.department_id
        JOIN lecturers l ON l.lecturer_id = cs.lecturer_id
        LEFT JOIN schedules sch
               ON sch.section_id = cs.section_id
              AND sch.status <> 'CANCELLED'
        LEFT JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
        LEFT JOIN time_slots ts_end ON ts_end.slot_id = sch.slot_end_id
        LEFT JOIN classrooms cr ON cr.classroom_id = sch.classroom_id
        LEFT JOIN buildings b ON b.building_id = cr.building_id
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
            AND cs.section_id = :id
            """ + TABLE_ORDER, nativeQuery = true)
    Optional<StaffSectionTableProjection> findStaffTableById(@Param("id") Integer id);

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms
        WHERE classroom_id = :classroomId
          AND is_active = TRUE
          AND is_deleted = FALSE
        """, nativeQuery = true)
    int countActiveClassroomById(@Param("classroomId") Integer classroomId);

    @Query(value = """
        SELECT COUNT(*)
        FROM time_slots start_slot
        JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
        WHERE start_slot.slot_id = :slotStartId
          AND end_slot.slot_id >= start_slot.slot_id
          AND end_slot.end_time > start_slot.start_time
        """, nativeQuery = true)
    int countValidSlotRange(@Param("slotStartId") Integer slotStartId,
                            @Param("slotEndId") Integer slotEndId);

    @Query(value = """
        SELECT schedule_id
        FROM schedules
        WHERE section_id = :sectionId
          AND status <> 'CANCELLED'
        LIMIT 1
        """, nativeQuery = true)
    Optional<Integer> findScheduleIdBySectionId(@Param("sectionId") Integer sectionId);

    @Modifying
    @Query(value = """
        INSERT INTO schedules (
            section_id,
            classroom_id,
            day_of_week,
            slot_start_id,
            slot_end_id,
            start_time,
            end_time,
            assigned_at,
            status
        )
        SELECT
            :sectionId,
            :classroomId,
            :dayOfWeek,
            start_slot.slot_id,
            end_slot.slot_id,
            start_slot.start_time,
            end_slot.end_time,
            CASE WHEN :classroomId IS NULL THEN NULL ELSE CURRENT_TIMESTAMP END,
            CASE WHEN :classroomId IS NULL THEN 'UNASSIGNED' ELSE 'ASSIGNED' END
        FROM time_slots start_slot
        JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
        WHERE start_slot.slot_id = :slotStartId
        """, nativeQuery = true)
    void insertSchedule(
            @Param("sectionId") Integer sectionId,
            @Param("classroomId") Integer classroomId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId
    );

    @Modifying
    @Query(value = """
        UPDATE schedules
        SET classroom_id = :classroomId,
            day_of_week = :dayOfWeek,
            slot_start_id = :slotStartId,
            slot_end_id = :slotEndId,
            start_time = (SELECT start_time FROM time_slots WHERE slot_id = :slotStartId),
            end_time = (SELECT end_time FROM time_slots WHERE slot_id = :slotEndId),
            assigned_at = CASE WHEN :classroomId IS NULL THEN NULL ELSE COALESCE(assigned_at, CURRENT_TIMESTAMP) END,
            status = CASE WHEN :classroomId IS NULL THEN 'UNASSIGNED' ELSE 'ASSIGNED' END
        WHERE schedule_id = :scheduleId
        """, nativeQuery = true)
    void updateScheduleById(
            @Param("scheduleId") Integer scheduleId,
            @Param("classroomId") Integer classroomId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId
    );

    @Modifying
    @Query(value = """
        UPDATE schedules
        SET status = 'CANCELLED'
        WHERE section_id = :sectionId
        """, nativeQuery = true)
    void deactivateSchedulesOfSection(@Param("sectionId") Integer sectionId);

    @Query(value = "SELECT status FROM semesters WHERE semester_id = :semesterId", nativeQuery = true)
    String findSemesterStatus(@Param("semesterId") Integer semesterId);

    @Query(value = """
        SELECT COUNT(*)
        FROM students
        WHERE class_name = :className
          AND is_deleted = FALSE
        """, nativeQuery = true)
    int countStudentsByClassName(@Param("className") String className);

    @Query(value = """
        SELECT COUNT(*)
        FROM student_section_enrollments
        WHERE section_id = :sectionId
          AND status = 'ENROLLED'
        """, nativeQuery = true)
    int countActiveEnrollmentsBySectionId(@Param("sectionId") Integer sectionId);

    @Modifying
    @Query(value = """
        UPDATE student_section_enrollments
        SET status = 'DROPPED'
        WHERE section_id = :sectionId
        """, nativeQuery = true)
    void deactivateEnrollmentsOfSection(@Param("sectionId") Integer sectionId);

    @Modifying
    @Query(value = """
        INSERT INTO student_section_enrollments(student_id, section_id, status, enrolled_at)
        SELECT s.student_id, :sectionId, 'ENROLLED', CURRENT_TIMESTAMP
        FROM students s
        WHERE s.class_name = :className
          AND s.is_deleted = FALSE
        ON DUPLICATE KEY UPDATE
            status = 'ENROLLED',
            enrolled_at = VALUES(enrolled_at)
        """, nativeQuery = true)
    void enrollStudentsByClassName(@Param("sectionId") Integer sectionId,
                                   @Param("className") String className);

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
        Integer getSlotStartId();
        Integer getSlotEndId();
        Integer getSlotStart();
        Integer getSlotEnd();
        Integer getFromWeekNo();
        Integer getToWeekNo();
        String getSchedule();
        Integer getClassroomId();
        String getRoom();
        String getClassroomCode();
        String getScheduleStatus();
        String getValidationStatus();
        String getConflictReason();
        String getAllocationStatus();
        String getStatusText();
        String getSectionStatus();
        String getClassIds();
        String getClassCodes();
        String getClassNames();
    }
}
