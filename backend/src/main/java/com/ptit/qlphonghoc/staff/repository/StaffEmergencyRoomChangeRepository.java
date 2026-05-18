package com.ptit.qlphonghoc.staff.repository;

import com.ptit.qlphonghoc.staff.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StaffEmergencyRoomChangeRepository extends JpaRepository<ClassSection, Integer> {

    @Query(value = """
        SELECT COUNT(*)
        FROM users
        WHERE id = :userId
          AND role IN ('STAFF', 'ADMIN')
          AND is_active = TRUE
          AND is_deleted = FALSE
        """, nativeQuery = true)
    int countActiveStaffOrAdminById(@Param("userId") Integer userId);

    @Query(value = """
        SELECT
            ss.id AS scheduleId,
            cs.semester_id AS semesterId,
            cs.id AS sectionId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            ss.day_of_week AS dayOfWeekCode,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeekText,
            ts.id AS timeSlotId,
            ts.slot_number AS slotNumber,
            ra.classroom_id AS currentClassroomId,
            CONCAT(b.code, '-', cr.room_number) AS currentRoomCode,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType,
            sem.start_date AS semesterStartDate,
            sem.end_date AS semesterEndDate
        FROM section_schedules ss
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN semesters sem ON sem.id = cs.semester_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
        JOIN classrooms cr ON cr.id = ra.classroom_id
        JOIN buildings b ON b.id = cr.building_id
        WHERE cs.semester_id = :semesterId
          AND cs.status = 'ACTIVE'
          AND ss.is_active = TRUE
        ORDER BY c.course_code, cs.section_code, ts.slot_number
        """, nativeQuery = true)
    List<ScheduleProjection> findSchedulesBySemester(@Param("semesterId") Integer semesterId);

    @Query(value = """
        SELECT
            ss.id AS scheduleId,
            cs.semester_id AS semesterId,
            cs.id AS sectionId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            ss.day_of_week AS dayOfWeekCode,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeekText,
            ts.id AS timeSlotId,
            ts.slot_number AS slotNumber,
            ra.classroom_id AS currentClassroomId,
            CONCAT(b.code, '-', cr.room_number) AS currentRoomCode,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType,
            sem.start_date AS semesterStartDate,
            sem.end_date AS semesterEndDate
        FROM section_schedules ss
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN semesters sem ON sem.id = cs.semester_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
        JOIN classrooms cr ON cr.id = ra.classroom_id
        JOIN buildings b ON b.id = cr.building_id
        WHERE cs.semester_id = :semesterId
          AND l.user_id = :lecturerUserId
          AND l.is_deleted = FALSE
          AND cs.status = 'ACTIVE'
          AND ss.is_active = TRUE
        ORDER BY c.course_code, cs.section_code, ts.slot_number
        """, nativeQuery = true)
    List<ScheduleProjection> findSchedulesBySemesterAndLecturerUserId(
            @Param("semesterId") Integer semesterId,
            @Param("lecturerUserId") Integer lecturerUserId
    );

    @Query(value = """
        SELECT
            ss.id AS scheduleId,
            cs.semester_id AS semesterId,
            cs.id AS sectionId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            ss.day_of_week AS dayOfWeekCode,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeekText,
            ts.id AS timeSlotId,
            ts.slot_number AS slotNumber,
            ra.classroom_id AS currentClassroomId,
            CONCAT(b.code, '-', cr.room_number) AS currentRoomCode,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType,
            sem.start_date AS semesterStartDate,
            sem.end_date AS semesterEndDate
        FROM section_schedules ss
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN semesters sem ON sem.id = cs.semester_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
        JOIN classrooms cr ON cr.id = ra.classroom_id
        JOIN buildings b ON b.id = cr.building_id
        WHERE ss.id = :scheduleId
          AND cs.semester_id = :semesterId
          AND cs.status = 'ACTIVE'
          AND ss.is_active = TRUE
        """, nativeQuery = true)
    Optional<ScheduleProjection> findScheduleDetail(
            @Param("semesterId") Integer semesterId,
            @Param("scheduleId") Integer scheduleId
    );

    @Query(value = """
        SELECT
            ss.id AS scheduleId,
            cs.semester_id AS semesterId,
            cs.id AS sectionId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            ss.day_of_week AS dayOfWeekCode,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeekText,
            ts.id AS timeSlotId,
            ts.slot_number AS slotNumber,
            ra.classroom_id AS currentClassroomId,
            CONCAT(b.code, '-', cr.room_number) AS currentRoomCode,
            cs.max_capacity AS maxCapacity,
            c.required_room_type AS requiredRoomType,
            sem.start_date AS semesterStartDate,
            sem.end_date AS semesterEndDate
        FROM section_schedules ss
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN semesters sem ON sem.id = cs.semester_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
        JOIN classrooms cr ON cr.id = ra.classroom_id
        JOIN buildings b ON b.id = cr.building_id
        WHERE ss.id = :scheduleId
          AND cs.semester_id = :semesterId
          AND l.user_id = :lecturerUserId
          AND l.is_deleted = FALSE
          AND cs.status = 'ACTIVE'
          AND ss.is_active = TRUE
        """, nativeQuery = true)
    Optional<ScheduleProjection> findScheduleDetailForLecturer(
            @Param("semesterId") Integer semesterId,
            @Param("scheduleId") Integer scheduleId,
            @Param("lecturerUserId") Integer lecturerUserId
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms cr
        WHERE cr.id = :classroomId
          AND cr.is_active = TRUE
          AND cr.capacity >= :expectedAttendees
          AND cr.id <> :oldClassroomId
          AND (:roomType IS NULL OR :roomType = '' OR cr.room_type = :roomType)
          AND NOT EXISTS (
              SELECT 1
              FROM room_allocations ra
              JOIN section_schedules ss ON ss.id = ra.schedule_id
              JOIN class_sections cs ON cs.id = ss.section_id
              WHERE ra.classroom_id = cr.id
                AND ra.is_active = TRUE
                AND ss.id <> :scheduleId
                AND cs.status = 'ACTIVE'
                AND cs.semester_id = :semesterId
                AND ss.day_of_week = :dayOfWeek
                AND ss.time_slot_id = :timeSlotId
          )
          AND NOT EXISTS (
              SELECT 1
              FROM room_borrow_requests rbr
              JOIN semesters sem ON sem.id = rbr.semester_id
              WHERE rbr.approved_classroom_id = cr.id
                AND rbr.status = 'APPROVED'
                AND rbr.semester_id = :semesterId
                AND rbr.time_slot_id = :timeSlotId
                AND (
                    (:scope = 'SESSION' AND rbr.booking_date = :targetDate)
                    OR (
                        :scope <> 'SESSION'
                        AND CASE DAYOFWEEK(rbr.booking_date)
                            WHEN 1 THEN 'SUN'
                            WHEN 2 THEN 'MON'
                            WHEN 3 THEN 'TUE'
                            WHEN 4 THEN 'WED'
                            WHEN 5 THEN 'THU'
                            WHEN 6 THEN 'FRI'
                            WHEN 7 THEN 'SAT'
                        END = :dayOfWeek
                        AND FLOOR(DATEDIFF(rbr.booking_date, sem.start_date) / 7) + 1 BETWEEN :fromWeek AND :toWeek
                    )
                )
          )
          AND NOT EXISTS (
              SELECT 1
              FROM temporary_room_changes trc
              JOIN section_schedules tss ON tss.id = trc.section_schedule_id
              JOIN semesters sem ON sem.id = trc.semester_id
              WHERE trc.new_classroom_id = cr.id
                AND trc.status = 'APPROVED'
                AND trc.is_active = TRUE
                AND trc.section_schedule_id <> :scheduleId
                AND trc.semester_id = :semesterId
                AND tss.day_of_week = :dayOfWeek
                AND tss.time_slot_id = :timeSlotId
                AND (
                    (:scope = 'SESSION' AND (
                        (trc.change_scope = 'SESSION' AND trc.target_date = :targetDate)
                        OR (trc.change_scope IN ('WEEK_RANGE','REST_OF_SEMESTER')
                            AND :targetWeek BETWEEN trc.from_week AND COALESCE(trc.to_week, 999))
                    ))
                    OR (:scope <> 'SESSION' AND (
                        (trc.change_scope = 'SESSION'
                            AND FLOOR(DATEDIFF(trc.target_date, sem.start_date) / 7) + 1 BETWEEN :fromWeek AND :toWeek)
                        OR (trc.change_scope IN ('WEEK_RANGE','REST_OF_SEMESTER')
                            AND trc.from_week <= :toWeek
                            AND COALESCE(trc.to_week, 999) >= :fromWeek)
                    ))
                )
          )
        """, nativeQuery = true)
    int countAvailableRoomForChange(
            @Param("semesterId") Integer semesterId,
            @Param("scheduleId") Integer scheduleId,
            @Param("oldClassroomId") Integer oldClassroomId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId,
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("roomType") String roomType,
            @Param("scope") String scope,
            @Param("targetDate") LocalDate targetDate,
            @Param("targetWeek") Integer targetWeek,
            @Param("fromWeek") Integer fromWeek,
            @Param("toWeek") Integer toWeek
    );

    @Query(value = """
        SELECT
            cr.id AS classroomId,
            CONCAT(b.code, '-', cr.room_number) AS roomCode,
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
            END AS mainEquipment,
            'Kha dung cho pham vi doi phong da chon' AS statusText
        FROM classrooms cr
        JOIN buildings b ON b.id = cr.building_id
        WHERE cr.is_active = TRUE
          AND cr.capacity >= :expectedAttendees
          AND cr.id <> :oldClassroomId
          AND (:roomType IS NULL OR :roomType = '' OR cr.room_type = :roomType)
          AND (
              :keyword IS NULL OR :keyword = ''
              OR LOWER(CONCAT(b.code, '-', cr.room_number)) LIKE CONCAT('%', LOWER(:keyword), '%')
              OR LOWER(cr.room_type) LIKE CONCAT('%', LOWER(:keyword), '%')
          )
          AND NOT EXISTS (
              SELECT 1
              FROM room_allocations ra
              JOIN section_schedules ss ON ss.id = ra.schedule_id
              JOIN class_sections cs ON cs.id = ss.section_id
              WHERE ra.classroom_id = cr.id
                AND ra.is_active = TRUE
                AND ss.id <> :scheduleId
                AND cs.status = 'ACTIVE'
                AND cs.semester_id = :semesterId
                AND ss.day_of_week = :dayOfWeek
                AND ss.time_slot_id = :timeSlotId
          )
          AND NOT EXISTS (
              SELECT 1
              FROM room_borrow_requests rbr
              JOIN semesters sem ON sem.id = rbr.semester_id
              WHERE rbr.approved_classroom_id = cr.id
                AND rbr.status = 'APPROVED'
                AND rbr.semester_id = :semesterId
                AND rbr.time_slot_id = :timeSlotId
                AND (
                    (:scope = 'SESSION' AND rbr.booking_date = :targetDate)
                    OR (
                        :scope <> 'SESSION'
                        AND CASE DAYOFWEEK(rbr.booking_date)
                            WHEN 1 THEN 'SUN'
                            WHEN 2 THEN 'MON'
                            WHEN 3 THEN 'TUE'
                            WHEN 4 THEN 'WED'
                            WHEN 5 THEN 'THU'
                            WHEN 6 THEN 'FRI'
                            WHEN 7 THEN 'SAT'
                        END = :dayOfWeek
                        AND FLOOR(DATEDIFF(rbr.booking_date, sem.start_date) / 7) + 1 BETWEEN :fromWeek AND :toWeek
                    )
                )
          )
          AND NOT EXISTS (
              SELECT 1
              FROM temporary_room_changes trc
              JOIN section_schedules tss ON tss.id = trc.section_schedule_id
              JOIN semesters sem ON sem.id = trc.semester_id
              WHERE trc.new_classroom_id = cr.id
                AND trc.status = 'APPROVED'
                AND trc.is_active = TRUE
                AND trc.section_schedule_id <> :scheduleId
                AND trc.semester_id = :semesterId
                AND tss.day_of_week = :dayOfWeek
                AND tss.time_slot_id = :timeSlotId
                AND (
                    (:scope = 'SESSION' AND (
                        (trc.change_scope = 'SESSION' AND trc.target_date = :targetDate)
                        OR (trc.change_scope IN ('WEEK_RANGE','REST_OF_SEMESTER')
                            AND :targetWeek BETWEEN trc.from_week AND COALESCE(trc.to_week, 999))
                    ))
                    OR (:scope <> 'SESSION' AND (
                        (trc.change_scope = 'SESSION'
                            AND FLOOR(DATEDIFF(trc.target_date, sem.start_date) / 7) + 1 BETWEEN :fromWeek AND :toWeek)
                        OR (trc.change_scope IN ('WEEK_RANGE','REST_OF_SEMESTER')
                            AND trc.from_week <= :toWeek
                            AND COALESCE(trc.to_week, 999) >= :fromWeek)
                    ))
                )
          )
        ORDER BY cr.capacity ASC, b.code, cr.room_number
        """, nativeQuery = true)
    List<AvailableRoomProjection> findAvailableRoomsForChange(
            @Param("semesterId") Integer semesterId,
            @Param("scheduleId") Integer scheduleId,
            @Param("oldClassroomId") Integer oldClassroomId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("roomType") String roomType,
            @Param("keyword") String keyword,
            @Param("scope") String scope,
            @Param("targetDate") LocalDate targetDate,
            @Param("targetWeek") Integer targetWeek,
            @Param("fromWeek") Integer fromWeek,
            @Param("toWeek") Integer toWeek
    );

    @Modifying
    @Query(value = """
        INSERT INTO temporary_room_changes (
            section_schedule_id,
            semester_id,
            change_scope,
            target_date,
            from_week,
            to_week,
            old_classroom_id,
            requested_classroom_id,
            new_classroom_id,
            reason,
            requested_by,
            created_by,
            status,
            reviewed_by,
            reviewed_at,
            review_note,
            reject_reason,
            is_active
        )
        VALUES (
            :scheduleId,
            :semesterId,
            :scope,
            :targetDate,
            :fromWeek,
            :toWeek,
            :oldClassroomId,
            :newClassroomId,
            :newClassroomId,
            :reason,
            :staffUserId,
            :staffUserId,
            'APPROVED',
            :staffUserId,
            CURRENT_TIMESTAMP,
            :reviewNote,
            NULL,
            TRUE
        )
        """, nativeQuery = true)
    void insertApprovedEmergencyChange(
            @Param("semesterId") Integer semesterId,
            @Param("scheduleId") Integer scheduleId,
            @Param("scope") String scope,
            @Param("targetDate") LocalDate targetDate,
            @Param("fromWeek") Integer fromWeek,
            @Param("toWeek") Integer toWeek,
            @Param("oldClassroomId") Integer oldClassroomId,
            @Param("newClassroomId") Integer newClassroomId,
            @Param("reason") String reason,
            @Param("staffUserId") Integer staffUserId,
            @Param("reviewNote") String reviewNote
    );

    @Modifying
    @Query(value = """
        INSERT INTO temporary_room_changes (
            section_schedule_id,
            semester_id,
            change_scope,
            target_date,
            from_week,
            to_week,
            old_classroom_id,
            requested_classroom_id,
            new_classroom_id,
            reason,
            requested_by,
            created_by,
            status,
            reviewed_by,
            reviewed_at,
            review_note,
            reject_reason,
            is_active
        )
        VALUES (
            :scheduleId,
            :semesterId,
            :scope,
            :targetDate,
            :fromWeek,
            :toWeek,
            :oldClassroomId,
            :requestedClassroomId,
            NULL,
            :reason,
            :lecturerUserId,
            :lecturerUserId,
            'PENDING',
            NULL,
            NULL,
            NULL,
            NULL,
            FALSE
        )
        """, nativeQuery = true)
    void insertPendingLecturerChange(
            @Param("semesterId") Integer semesterId,
            @Param("scheduleId") Integer scheduleId,
            @Param("scope") String scope,
            @Param("targetDate") LocalDate targetDate,
            @Param("fromWeek") Integer fromWeek,
            @Param("toWeek") Integer toWeek,
            @Param("oldClassroomId") Integer oldClassroomId,
            @Param("requestedClassroomId") Integer requestedClassroomId,
            @Param("reason") String reason,
            @Param("lecturerUserId") Integer lecturerUserId
    );

    @Modifying
    @Query(value = """
        UPDATE temporary_room_changes
        SET status = 'APPROVED',
            new_classroom_id = requested_classroom_id,
            reviewed_by = :staffUserId,
            reviewed_at = CURRENT_TIMESTAMP,
            review_note = :reviewNote,
            reject_reason = NULL,
            is_active = TRUE
        WHERE id = :id
          AND status = 'PENDING'
          AND requested_classroom_id IS NOT NULL
        """, nativeQuery = true)
    int approvePendingChange(
            @Param("id") Integer id,
            @Param("staffUserId") Integer staffUserId,
            @Param("reviewNote") String reviewNote
    );

    @Modifying
    @Query(value = """
        UPDATE temporary_room_changes
        SET status = 'REJECTED',
            new_classroom_id = NULL,
            reviewed_by = :staffUserId,
            reviewed_at = CURRENT_TIMESTAMP,
            review_note = :rejectReason,
            reject_reason = :rejectReason,
            is_active = FALSE
        WHERE id = :id
          AND status = 'PENDING'
        """, nativeQuery = true)
    int rejectPendingChange(
            @Param("id") Integer id,
            @Param("staffUserId") Integer staffUserId,
            @Param("rejectReason") String rejectReason
    );

    @Query(value = "SELECT LAST_INSERT_ID()", nativeQuery = true)
    Integer getLastInsertId();

    @Query(value = """
        SELECT
            trc.id AS id,
            trc.semester_id AS semesterId,
            trc.section_schedule_id AS sectionScheduleId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeek,
            ts.slot_number AS slot,
            trc.change_scope AS changeScope,
            trc.target_date AS targetDate,
            trc.from_week AS fromWeek,
            trc.to_week AS toWeek,
            trc.old_classroom_id AS oldClassroomId,
            CONCAT(old_b.code, '-', old_cr.room_number) AS oldRoomCode,
            trc.requested_classroom_id AS requestedClassroomId,
            CONCAT(req_b.code, '-', req_cr.room_number) AS requestedRoomCode,
            trc.new_classroom_id AS newClassroomId,
            CONCAT(new_b.code, '-', new_cr.room_number) AS newRoomCode,
            trc.reason AS reason,
            trc.requested_by AS requestedBy,
            requester.full_name AS requesterName,
            requester.username AS requesterUsername,
            trc.status AS status,
            trc.is_active AS active,
            trc.reviewed_by AS reviewedBy,
            reviewer.full_name AS reviewedByName,
            trc.reviewed_at AS reviewedAt,
            trc.review_note AS reviewNote,
            trc.reject_reason AS rejectReason,
            trc.created_at AS createdAt
        FROM temporary_room_changes trc
        JOIN section_schedules ss ON ss.id = trc.section_schedule_id
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        JOIN users requester ON requester.id = trc.requested_by
        JOIN classrooms old_cr ON old_cr.id = trc.old_classroom_id
        JOIN buildings old_b ON old_b.id = old_cr.building_id
        LEFT JOIN classrooms req_cr ON req_cr.id = trc.requested_classroom_id
        LEFT JOIN buildings req_b ON req_b.id = req_cr.building_id
        LEFT JOIN classrooms new_cr ON new_cr.id = trc.new_classroom_id
        LEFT JOIN buildings new_b ON new_b.id = new_cr.building_id
        LEFT JOIN users reviewer ON reviewer.id = trc.reviewed_by
        WHERE trc.id = :id
        """, nativeQuery = true)
    Optional<ChangeProjection> findChangeById(@Param("id") Integer id);

    @Query(value = """
        SELECT
            trc.id AS id,
            trc.semester_id AS semesterId,
            trc.section_schedule_id AS sectionScheduleId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeek,
            ts.slot_number AS slot,
            trc.change_scope AS changeScope,
            trc.target_date AS targetDate,
            trc.from_week AS fromWeek,
            trc.to_week AS toWeek,
            trc.old_classroom_id AS oldClassroomId,
            CONCAT(old_b.code, '-', old_cr.room_number) AS oldRoomCode,
            trc.requested_classroom_id AS requestedClassroomId,
            CONCAT(req_b.code, '-', req_cr.room_number) AS requestedRoomCode,
            trc.new_classroom_id AS newClassroomId,
            CONCAT(new_b.code, '-', new_cr.room_number) AS newRoomCode,
            trc.reason AS reason,
            trc.requested_by AS requestedBy,
            requester.full_name AS requesterName,
            requester.username AS requesterUsername,
            trc.status AS status,
            trc.is_active AS active,
            trc.reviewed_by AS reviewedBy,
            reviewer.full_name AS reviewedByName,
            trc.reviewed_at AS reviewedAt,
            trc.review_note AS reviewNote,
            trc.reject_reason AS rejectReason,
            trc.created_at AS createdAt
        FROM temporary_room_changes trc
        JOIN section_schedules ss ON ss.id = trc.section_schedule_id
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        JOIN users requester ON requester.id = trc.requested_by
        JOIN classrooms old_cr ON old_cr.id = trc.old_classroom_id
        JOIN buildings old_b ON old_b.id = old_cr.building_id
        LEFT JOIN classrooms req_cr ON req_cr.id = trc.requested_classroom_id
        LEFT JOIN buildings req_b ON req_b.id = req_cr.building_id
        LEFT JOIN classrooms new_cr ON new_cr.id = trc.new_classroom_id
        LEFT JOIN buildings new_b ON new_b.id = new_cr.building_id
        LEFT JOIN users reviewer ON reviewer.id = trc.reviewed_by
        WHERE (:status IS NULL OR :status = '' OR trc.status = :status)
        ORDER BY
            CASE trc.status
                WHEN 'PENDING' THEN 0
                WHEN 'APPROVED' THEN 1
                WHEN 'REJECTED' THEN 2
                ELSE 3
            END,
            trc.created_at DESC
        """, nativeQuery = true)
    List<ChangeProjection> findChangeRequests(@Param("status") String status);

    @Query(value = """
        SELECT
            trc.id AS id,
            trc.semester_id AS semesterId,
            trc.section_schedule_id AS sectionScheduleId,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.course_name AS courseName,
            l.full_name AS lecturerName,
            CASE ss.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeek,
            ts.slot_number AS slot,
            trc.change_scope AS changeScope,
            trc.target_date AS targetDate,
            trc.from_week AS fromWeek,
            trc.to_week AS toWeek,
            trc.old_classroom_id AS oldClassroomId,
            CONCAT(old_b.code, '-', old_cr.room_number) AS oldRoomCode,
            trc.requested_classroom_id AS requestedClassroomId,
            CONCAT(req_b.code, '-', req_cr.room_number) AS requestedRoomCode,
            trc.new_classroom_id AS newClassroomId,
            CONCAT(new_b.code, '-', new_cr.room_number) AS newRoomCode,
            trc.reason AS reason,
            trc.requested_by AS requestedBy,
            requester.full_name AS requesterName,
            requester.username AS requesterUsername,
            trc.status AS status,
            trc.is_active AS active,
            trc.reviewed_by AS reviewedBy,
            reviewer.full_name AS reviewedByName,
            trc.reviewed_at AS reviewedAt,
            trc.review_note AS reviewNote,
            trc.reject_reason AS rejectReason,
            trc.created_at AS createdAt
        FROM temporary_room_changes trc
        JOIN section_schedules ss ON ss.id = trc.section_schedule_id
        JOIN class_sections cs ON cs.id = ss.section_id
        JOIN courses c ON c.id = cs.course_id
        JOIN lecturers l ON l.id = cs.lecturer_id
        JOIN time_slots ts ON ts.id = ss.time_slot_id
        JOIN users requester ON requester.id = trc.requested_by
        JOIN classrooms old_cr ON old_cr.id = trc.old_classroom_id
        JOIN buildings old_b ON old_b.id = old_cr.building_id
        LEFT JOIN classrooms req_cr ON req_cr.id = trc.requested_classroom_id
        LEFT JOIN buildings req_b ON req_b.id = req_cr.building_id
        LEFT JOIN classrooms new_cr ON new_cr.id = trc.new_classroom_id
        LEFT JOIN buildings new_b ON new_b.id = new_cr.building_id
        LEFT JOIN users reviewer ON reviewer.id = trc.reviewed_by
        WHERE trc.requested_by = :userId
        ORDER BY trc.created_at DESC
        """, nativeQuery = true)
    List<ChangeProjection> findChangeRequestsByRequester(@Param("userId") Integer userId);

    interface ScheduleProjection {
        Integer getScheduleId();
        Integer getSemesterId();
        Integer getSectionId();
        String getClassCode();
        String getCourseName();
        String getLecturerName();
        String getDayOfWeekCode();
        String getDayOfWeekText();
        Integer getTimeSlotId();
        Integer getSlotNumber();
        Integer getCurrentClassroomId();
        String getCurrentRoomCode();
        Integer getMaxCapacity();
        String getRequiredRoomType();
        LocalDate getSemesterStartDate();
        LocalDate getSemesterEndDate();
    }

    interface AvailableRoomProjection {
        Integer getClassroomId();
        String getRoomCode();
        Integer getCapacity();
        String getRoomType();
        String getRoomTypeText();
        String getMainEquipment();
        String getStatusText();
    }

    interface ChangeProjection {
        Integer getId();
        Integer getSemesterId();
        Integer getSectionScheduleId();
        String getClassCode();
        String getCourseName();
        String getLecturerName();
        String getDayOfWeek();
        Integer getSlot();
        String getChangeScope();
        LocalDate getTargetDate();
        Integer getFromWeek();
        Integer getToWeek();
        Integer getOldClassroomId();
        String getOldRoomCode();
        Integer getRequestedClassroomId();
        String getRequestedRoomCode();
        Integer getNewClassroomId();
        String getNewRoomCode();
        String getReason();
        Integer getRequestedBy();
        String getRequesterName();
        String getRequesterUsername();
        String getStatus();
        Boolean getActive();
        Integer getReviewedBy();
        String getReviewedByName();
        LocalDateTime getReviewedAt();
        String getReviewNote();
        String getRejectReason();
        LocalDateTime getCreatedAt();
    }
}
