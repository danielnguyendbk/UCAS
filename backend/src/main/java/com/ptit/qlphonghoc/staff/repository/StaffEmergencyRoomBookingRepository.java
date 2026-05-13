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
        SELECT id
        FROM time_slots
        WHERE slot_number = :slotNumber
        """, nativeQuery = true)
    Optional<Integer> findTimeSlotIdBySlotNumber(@Param("slotNumber") Integer slotNumber);

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
        SELECT COUNT(*)
        FROM semesters
        WHERE id = :semesterId
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
        WHERE id = :classroomId
          AND is_active = TRUE
          AND capacity >= :expectedAttendees
        """, nativeQuery = true)
    int countUsableClassroom(
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms cr
        WHERE cr.id = :classroomId
          AND cr.is_active = TRUE
          AND cr.capacity >= :expectedAttendees

          AND NOT EXISTS (
              SELECT 1
              FROM room_allocations ra
              JOIN section_schedules ss ON ss.id = ra.schedule_id
              JOIN class_sections cs ON cs.id = ss.section_id
              WHERE ra.classroom_id = cr.id
                AND ra.is_active = TRUE
                AND cs.status = 'ACTIVE'
                AND cs.semester_id = :semesterId
                AND ss.day_of_week = :dayOfWeek
                AND ss.time_slot_id = :timeSlotId
          )

          AND NOT EXISTS (
              SELECT 1
              FROM room_borrow_requests rbr
              WHERE rbr.approved_classroom_id = cr.id
                AND rbr.status = 'APPROVED'
                AND rbr.booking_date = :bookingDate
                AND rbr.time_slot_id = :timeSlotId
          )
        """, nativeQuery = true)
    int countAvailableClassroomForEmergency(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId,
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees
    );

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

            /* ĐÃ CẬP NHẬT THIẾT BỊ THEO YÊU CẦU MỚI */
            CASE cr.room_type
                WHEN 'LAB' THEN 'Máy tính, Máy lạnh'
                WHEN 'SEMINAR' THEN 'Micro, Tivi, Máy lạnh'
                WHEN 'LECTURE' THEN 'Micro, Tivi, Máy lạnh'
                WHEN 'AUDITORIUM' THEN 'Micro, Máy chiếu, Máy lạnh'
                ELSE 'Không có'
            END AS mainEquipment,

            'Khả dụng theo dữ liệu hiện tại' AS statusText

        FROM classrooms cr
        JOIN buildings b ON b.id = cr.building_id

        WHERE cr.is_active = TRUE
          AND cr.capacity >= :expectedAttendees

          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(CONCAT(b.code, '-', cr.room_number)) LIKE CONCAT('%', LOWER(:keyword), '%')
               OR LOWER(cr.room_type) LIKE CONCAT('%', LOWER(:keyword), '%')
               /* CẬP NHẬT TÌM KIẾM ĐỂ KHỚP VỚI THIẾT BỊ MỚI */
               OR LOWER(
                    CASE cr.room_type
                        WHEN 'LAB' THEN 'Máy tính, Máy lạnh'
                        WHEN 'SEMINAR' THEN 'Micro, Tivi, Máy lạnh'
                        WHEN 'LECTURE' THEN 'Micro, Tivi, Máy lạnh'
                        WHEN 'AUDITORIUM' THEN 'Micro, Máy chiếu, Máy lạnh'
                        ELSE ''
                    END
                  ) LIKE CONCAT('%', LOWER(:keyword), '%')
          )

          AND (:roomType IS NULL OR :roomType = '' OR cr.room_type = :roomType)

          AND NOT EXISTS (
              SELECT 1
              FROM room_allocations ra
              JOIN section_schedules ss ON ss.id = ra.schedule_id
              JOIN class_sections cs ON cs.id = ss.section_id
              WHERE ra.classroom_id = cr.id
                AND ra.is_active = TRUE
                AND cs.status = 'ACTIVE'
                AND cs.semester_id = :semesterId
                AND ss.day_of_week = :dayOfWeek
                AND ss.time_slot_id = :timeSlotId
          )

          AND NOT EXISTS (
              SELECT 1
              FROM room_borrow_requests rbr
              WHERE rbr.approved_classroom_id = cr.id
                AND rbr.status = 'APPROVED'
                AND rbr.booking_date = :bookingDate
                AND rbr.time_slot_id = :timeSlotId
          )

        ORDER BY b.code, cr.room_number
        """, nativeQuery = true)
    List<AvailableRoomProjection> findAvailableRooms(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlotId") Integer timeSlotId,
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
            time_slot_id,
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
        VALUES (
            :requestTitle,
            'OTHER',
            'PERSONAL',
            :semesterId,
            :bookingDate,
            :timeSlotId,
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
        )
        """, nativeQuery = true)
    void insertEmergencyBooking(
            @Param("requestTitle") String requestTitle,
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("timeSlotId") Integer timeSlotId,
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
            rbr.id AS id,
            rbr.request_title AS requestTitle,
            rbr.semester_id AS semesterId,
            rbr.booking_date AS bookingDate,
            ts.slot_number AS slot,

            CASE ts.slot_number
                WHEN 1 THEN '1-3'
                WHEN 2 THEN '4-6'
                WHEN 3 THEN '7-9'
                WHEN 4 THEN '10-12'
                WHEN 5 THEN '13-15'
                ELSE CAST(ts.slot_number AS CHAR)
            END AS periodText,

            cr.id AS classroomId,
            CONCAT(b.code, '-', cr.room_number) AS roomCode,

            rbr.expected_attendees AS expectedAttendees,
            rbr.purpose_note AS purpose,
            rbr.processing_note AS emergencyReason,
            rbr.status AS status,
            rbr.approved_by AS approvedBy

        FROM room_borrow_requests rbr
        JOIN time_slots ts ON ts.id = rbr.time_slot_id
        JOIN classrooms cr ON cr.id = rbr.approved_classroom_id
        JOIN buildings b ON b.id = cr.building_id
        WHERE rbr.id = :id
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
    }

    interface EmergencyBookingProjection {
        Integer getId();

        String getRequestTitle();

        Integer getSemesterId();

        LocalDate getBookingDate();

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