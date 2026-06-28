package com.ptit.qlphonghoc.staff.repository;

import com.ptit.qlphonghoc.staff.entity.ClassSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StaffEmergencyRoomBookingRepository extends JpaRepository<ClassSection, Integer> {

    @Query(value = """
        SELECT COUNT(*)
        FROM time_slots start_slot
        JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
        WHERE start_slot.slot_id = :slotStartId
          AND end_slot.slot_no >= start_slot.slot_no
        """, nativeQuery = true)
    int countValidSlotRange(
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM users
        WHERE user_id = :userId
          AND role IN ('STAFF', 'ADMIN')
          AND status = 'ACTIVE'
        """, nativeQuery = true)
    int countActiveStaffOrAdminById(@Param("userId") Integer userId);

    @Query(value = """
        SELECT COUNT(*)
        FROM semesters
        WHERE semester_id = :semesterId
          AND is_deleted = FALSE
          AND :bookingDate BETWEEN start_date AND end_date
        """, nativeQuery = true)
    int countValidSemesterDate(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms
        WHERE classroom_id = :classroomId
          AND is_active = TRUE
          AND is_deleted = FALSE
          AND capacity >= :expectedAttendees
        """, nativeQuery = true)
    int countUsableClassroom(
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms cr
        WHERE cr.classroom_id = :classroomId
          AND cr.is_active = TRUE
          AND cr.is_deleted = FALSE
          AND cr.capacity >= :expectedAttendees

          AND NOT EXISTS (
              SELECT 1
              FROM schedules sch
              JOIN class_sections cs ON cs.section_id = sch.section_id
              WHERE sch.classroom_id = cr.classroom_id
                AND sch.status = 'ASSIGNED'
                AND cs.status = 'ACTIVE'
                AND cs.semester_id = :semesterId
                AND sch.day_of_week = :dayOfWeek
                AND sch.slot_start_id <= :slotEndId
                AND sch.slot_end_id >= :slotStartId
          )

          AND NOT EXISTS (
              SELECT 1
              FROM room_borrow_requests rbr
              WHERE rbr.approved_classroom_id = cr.classroom_id
                AND rbr.status = 'APPROVED'
                AND rbr.booking_date = :bookingDate
                AND rbr.slot_start_id <= :slotEndId
                AND rbr.slot_end_id >= :slotStartId
          )

          AND NOT EXISTS (
              SELECT 1
              FROM temporary_room_changes trc
              JOIN schedules sch ON sch.schedule_id = trc.schedule_id
              JOIN semesters sem ON sem.semester_id = trc.semester_id
              WHERE trc.new_classroom_id = cr.classroom_id
                AND trc.status = 'APPROVED'
                AND trc.is_active = TRUE
                AND trc.semester_id = :semesterId
                AND sch.day_of_week = :dayOfWeek
                AND sch.slot_start_id <= :slotEndId
                AND sch.slot_end_id >= :slotStartId
                AND (
                    (trc.change_scope = 'SESSION' AND trc.target_date = :bookingDate)
                    OR (
                        trc.change_scope IN ('WEEK_RANGE','REST_OF_SEMESTER')
                        AND FLOOR(DATEDIFF(:bookingDate, sem.start_date) / 7) + 1
                            BETWEEN trc.from_week AND COALESCE(trc.to_week, 999)
                    )
                )
          )
        """, nativeQuery = true)
    int countAvailableClassroomForEmergency(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees
    );

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
            END AS mainEquipment,
            ts_s.slot_no AS slotStartNo,
            ts_e.slot_no AS slotEndNo,
            TIME_FORMAT(ts_s.start_time, '%H:%i') AS startTime,
            TIME_FORMAT(ts_e.end_time, '%H:%i') AS endTime,
            CONCAT('Kha dung tiet ', ts_s.slot_no,
                CASE WHEN ts_s.slot_no <> ts_e.slot_no THEN CONCAT('-', ts_e.slot_no) ELSE '' END,
                ' (', TIME_FORMAT(ts_s.start_time, '%H:%i'), '-', TIME_FORMAT(ts_e.end_time, '%H:%i'), ')')
            AS statusText
        FROM classrooms cr
        JOIN buildings b ON b.building_id = cr.building_id
        JOIN time_slots ts_s ON ts_s.slot_id = :slotStartId
        JOIN time_slots ts_e ON ts_e.slot_id = :slotEndId
        WHERE cr.is_active = TRUE
          AND cr.is_deleted = FALSE
          AND cr.capacity >= :expectedAttendees
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(CONCAT(b.building_code, '-', cr.room_number)) LIKE CONCAT('%', LOWER(:keyword), '%')
               OR LOWER(cr.room_type) LIKE CONCAT('%', LOWER(:keyword), '%')
               OR LOWER(
                    CASE cr.room_type
                        WHEN 'LAB' THEN 'May tinh, May lanh'
                        WHEN 'SEMINAR' THEN 'Micro, Tivi, May lanh'
                        WHEN 'LECTURE' THEN 'Micro, Tivi, May lanh'
                        WHEN 'AUDITORIUM' THEN 'Micro, May chieu, May lanh'
                        ELSE ''
                    END
                  ) LIKE CONCAT('%', LOWER(:keyword), '%')
          )
          AND (:roomType IS NULL OR :roomType = '' OR cr.room_type = :roomType)

          AND NOT EXISTS (
              SELECT 1
              FROM schedules sch
              JOIN class_sections cs ON cs.section_id = sch.section_id
              WHERE sch.classroom_id = cr.classroom_id
                AND sch.status = 'ASSIGNED'
                AND cs.status = 'ACTIVE'
                AND cs.semester_id = :semesterId
                AND sch.day_of_week = :dayOfWeek
                AND sch.slot_start_id <= :slotEndId
                AND sch.slot_end_id >= :slotStartId
          )

          AND NOT EXISTS (
              SELECT 1
              FROM room_borrow_requests rbr
              WHERE rbr.approved_classroom_id = cr.classroom_id
                AND rbr.status = 'APPROVED'
                AND rbr.booking_date = :bookingDate
                AND rbr.slot_start_id <= :slotEndId
                AND rbr.slot_end_id >= :slotStartId
          )

          AND NOT EXISTS (
              SELECT 1
              FROM temporary_room_changes trc
              JOIN schedules sch ON sch.schedule_id = trc.schedule_id
              JOIN semesters sem ON sem.semester_id = trc.semester_id
              WHERE trc.new_classroom_id = cr.classroom_id
                AND trc.status = 'APPROVED'
                AND trc.is_active = TRUE
                AND trc.semester_id = :semesterId
                AND sch.day_of_week = :dayOfWeek
                AND sch.slot_start_id <= :slotEndId
                AND sch.slot_end_id >= :slotStartId
                AND (
                    (trc.change_scope = 'SESSION' AND trc.target_date = :bookingDate)
                    OR (
                        trc.change_scope IN ('WEEK_RANGE','REST_OF_SEMESTER')
                        AND FLOOR(DATEDIFF(:bookingDate, sem.start_date) / 7) + 1
                            BETWEEN trc.from_week AND COALESCE(trc.to_week, 999)
                    )
                )
          )
        ORDER BY b.building_code, cr.room_number
        """, nativeQuery = true)
    List<AvailableRoomProjection> findAvailableRooms(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("roomType") String roomType,
            @Param("keyword") String keyword
    );

    @Modifying
    @Query(value = """
        INSERT INTO room_borrow_requests (
            request_title,
            request_type,
            booking_scope,
            semester_id,
            booking_date,
            slot_start_id,
            slot_end_id,
            start_time,
            end_time,
            requested_by,
            club_id,
            expected_attendees,
            preferred_building_id,
            preferred_classroom_id,
            requested_room_type,
            purpose_note,
            status,
            approved_classroom_id,
            approved_by,
            approved_at,
            processing_note,
            reject_reason
        )
        SELECT
            :requestTitle,
            'OTHER',
            'PERSONAL',
            :semesterId,
            :bookingDate,
            :slotStartId,
            :slotEndId,
            start_slot.start_time,
            end_slot.end_time,
            :staffUserId,
            NULL,
            :expectedAttendees,
            NULL,
            :classroomId,
            NULL,
            :purposeNote,
            'APPROVED',
            :classroomId,
            :staffUserId,
            CURRENT_TIMESTAMP,
            :processingNote,
            NULL
        FROM time_slots start_slot
        JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
        WHERE start_slot.slot_id = :slotStartId
        """, nativeQuery = true)
    void insertEmergencyBooking(
            @Param("requestTitle") String requestTitle,
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("staffUserId") Integer staffUserId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("classroomId") Integer classroomId,
            @Param("purposeNote") String purposeNote,
            @Param("processingNote") String processingNote
    );

    @Query(value = "SELECT LAST_INSERT_ID()", nativeQuery = true)
    Integer getLastInsertId();

    @Query(value = """
        SELECT
            rbr.borrow_request_id AS id,
            rbr.request_title AS requestTitle,
            rbr.semester_id AS semesterId,
            rbr.booking_date AS bookingDate,
            rbr.slot_start_id AS slotStartId,
            rbr.slot_end_id AS slotEndId,
            start_slot.slot_no AS slotStart,
            end_slot.slot_no AS slotEnd,
            start_slot.slot_no AS slot,
            CASE
                WHEN start_slot.slot_no = end_slot.slot_no THEN CAST(start_slot.slot_no AS CHAR)
                ELSE CONCAT(start_slot.slot_no, '-', end_slot.slot_no)
            END AS periodText,
            cr.classroom_id AS classroomId,
            CONCAT(b.building_code, '-', cr.room_number) AS roomCode,
            rbr.expected_attendees AS expectedAttendees,
            rbr.purpose_note AS purpose,
            rbr.processing_note AS emergencyReason,
            rbr.status AS status,
            rbr.approved_by AS approvedBy
        FROM room_borrow_requests rbr
        JOIN time_slots start_slot ON start_slot.slot_id = rbr.slot_start_id
        JOIN time_slots end_slot ON end_slot.slot_id = rbr.slot_end_id
        JOIN classrooms cr ON cr.classroom_id = rbr.approved_classroom_id
        JOIN buildings b ON b.building_id = cr.building_id
        WHERE rbr.borrow_request_id = :id
        """, nativeQuery = true)
    Optional<EmergencyBookingProjection> findEmergencyBookingById(@Param("id") Integer id);

    interface AvailableRoomProjection {
        Integer getClassroomId();
        String getRoomCode();
        Integer getCapacity();
        String getRoomType();
        String getRoomTypeText();
        String getMainEquipment();
        String getStatusText();
        Integer getSlotStartNo();
        Integer getSlotEndNo();
        String getStartTime();
        String getEndTime();
    }

    interface EmergencyBookingProjection {
        Integer getId();

        String getRequestTitle();

        Integer getSemesterId();

        LocalDate getBookingDate();

        Integer getSlotStartId();

        Integer getSlotEndId();

        Integer getSlotStart();

        Integer getSlotEnd();

        Integer getSlot();

        String getPeriodText();

        Integer getClassroomId();

        String getRoomCode();

        Integer getExpectedAttendees();

        String getPurpose();

        String getEmergencyReason();

        String getStatus();

        Integer getApprovedBy();
    }
}
