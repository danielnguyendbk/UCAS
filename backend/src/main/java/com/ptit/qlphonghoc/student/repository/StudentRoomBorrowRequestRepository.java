package com.ptit.qlphonghoc.student.repository;

import com.ptit.qlphonghoc.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudentRoomBorrowRequestRepository extends JpaRepository<Student, Integer> {

    String BORROW_SELECT = """
        SELECT
            rbr.borrow_request_id AS id,
            rbr.request_title AS requestTitle,
            rbr.request_type AS requestType,
            rbr.booking_scope AS bookingScope,
            rbr.semester_id AS semesterId,
            rbr.booking_date AS bookingDate,
            rbr.slot_start_id AS slotStartId,
            rbr.slot_end_id AS slotEndId,
            ts_start.slot_no AS slot,
            ts_start.slot_no AS slotStart,
            ts_end.slot_no AS slotEnd,
            CONCAT(ts_start.slot_no, '-', ts_end.slot_no) AS periodText,
            rbr.requested_by AS requestedBy,
            rbr.expected_attendees AS expectedAttendees,
            rbr.preferred_classroom_id AS preferredClassroomId,
            CONCAT(b.building_code, '-', cr.room_number) AS preferredRoomCode,
            rbr.approved_classroom_id AS approvedClassroomId,
            CASE
                WHEN approved_room.classroom_id IS NULL THEN NULL
                ELSE CONCAT(approved_building.building_code, '-', approved_room.room_number)
            END AS approvedRoomCode,
            rbr.requested_room_type AS requestedRoomType,
            rbr.purpose_note AS purposeNote,
            rbr.status AS status,
            rbr.processing_note AS processingNote,
            rbr.reject_reason AS rejectReason,
            rbr.approved_at AS approvedAt,
            rbr.created_at AS createdAt
        FROM room_borrow_requests rbr
        JOIN time_slots ts_start ON ts_start.slot_id = rbr.slot_start_id
        JOIN time_slots ts_end ON ts_end.slot_id = rbr.slot_end_id
        LEFT JOIN classrooms cr ON cr.classroom_id = rbr.preferred_classroom_id
        LEFT JOIN buildings b ON b.building_id = cr.building_id
        LEFT JOIN classrooms approved_room ON approved_room.classroom_id = rbr.approved_classroom_id
        LEFT JOIN buildings approved_building ON approved_building.building_id = approved_room.building_id
        """;

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
                WHEN 'LAB' THEN 'May tinh, Máy lạnh'
                WHEN 'SEMINAR' THEN 'Micro, Tivi, Máy lạnh'
                WHEN 'LECTURE' THEN 'Micro, Tivi, Máy lạnh'
                WHEN 'AUDITORIUM' THEN 'Micro, May chieu, Máy lạnh'
                ELSE 'Khong co'
            END AS mainEquipment,
            'Kha dung theo du lieu hien tai' AS statusText
        FROM classrooms cr
        JOIN buildings b ON b.building_id = cr.building_id
        WHERE cr.is_active = TRUE
          AND cr.is_deleted = FALSE
          AND cr.capacity >= :expectedAttendees
          AND (:roomType IS NULL OR :roomType = '' OR cr.room_type = :roomType)
          AND (
              :keyword IS NULL OR :keyword = ''
              OR LOWER(CONCAT(b.building_code, '-', cr.room_number)) LIKE CONCAT('%', LOWER(:keyword), '%')
              OR LOWER(cr.room_type) LIKE CONCAT('%', LOWER(:keyword), '%')
          )
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
              FROM exams e
              JOIN time_slots request_start ON request_start.slot_id = :slotStartId
              JOIN time_slots request_end ON request_end.slot_id = :slotEndId
              WHERE e.classroom_id = cr.classroom_id
                AND e.exam_date = :bookingDate
                AND e.status NOT IN ('CANCELLED','COMPLETED')
                AND e.start_time IS NOT NULL
                AND e.end_time IS NOT NULL
                AND NOT (e.end_time <= request_start.start_time OR e.start_time >= request_end.end_time)
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
          AND NOT EXISTS (
              SELECT 1
              FROM classroom_issue_reports cir
              WHERE cir.classroom_id = cr.classroom_id
                AND cir.is_deleted = FALSE
                AND cir.status IN ('PENDING','IN_PROGRESS')
                AND cir.severity_level IN ('HIGH','URGENT')
          )
        ORDER BY cr.capacity ASC, b.building_code, cr.room_number
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

    @Query(value = """
        SELECT COUNT(*)
        FROM classrooms cr
        WHERE cr.classroom_id = :classroomId
          AND cr.is_active = TRUE
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
              FROM exams e
              JOIN time_slots request_start ON request_start.slot_id = :slotStartId
              JOIN time_slots request_end ON request_end.slot_id = :slotEndId
              WHERE e.classroom_id = cr.classroom_id
                AND e.exam_date = :bookingDate
                AND e.status NOT IN ('CANCELLED','COMPLETED')
                AND e.start_time IS NOT NULL
                AND e.end_time IS NOT NULL
                AND NOT (e.end_time <= request_start.start_time OR e.start_time >= request_end.end_time)
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
          AND NOT EXISTS (
              SELECT 1
              FROM classroom_issue_reports cir
              WHERE cir.classroom_id = cr.classroom_id
                AND cir.is_deleted = FALSE
                AND cir.status IN ('PENDING','IN_PROGRESS')
                AND cir.severity_level IN ('HIGH','URGENT')
          )
        """, nativeQuery = true)
    int countAvailableClassroom(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("roomType") String roomType
    );

    @Modifying
    @Query(value = """
        INSERT INTO room_borrow_requests (
            request_title,
            request_type,
            booking_scope,
            semester_id,
            section_id,
            booking_date,
            slot_start_id,
            slot_end_id,
            start_time,
            end_time,
            requested_by,
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
            :requestType,
            :bookingScope,
            :semesterId,
            NULL,
            :bookingDate,
            start_slot.slot_id,
            end_slot.slot_id,
            start_slot.start_time,
            end_slot.end_time,
            :requestedBy,
            :expectedAttendees,
            NULL,
            :preferredClassroomId,
            :requestedRoomType,
            :purposeNote,
            'PENDING',
            NULL,
            NULL,
            NULL,
            NULL,
            NULL
        FROM time_slots start_slot
        JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
        WHERE start_slot.slot_id = :slotStartId
        """, nativeQuery = true)
    void insertBorrowRequest(
            @Param("requestTitle") String requestTitle,
            @Param("requestType") String requestType,
            @Param("bookingScope") String bookingScope,
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("requestedBy") Integer requestedBy,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("preferredClassroomId") Integer preferredClassroomId,
            @Param("requestedRoomType") String requestedRoomType,
            @Param("purposeNote") String purposeNote
    );

    @Query(value = "SELECT LAST_INSERT_ID()", nativeQuery = true)
    Integer getLastInsertId();

    @Query(value = BORROW_SELECT + """
        WHERE rbr.borrow_request_id = :id
        """, nativeQuery = true)
    Optional<BorrowRequestProjection> findBorrowRequestById(@Param("id") Integer id);

    @Query(value = BORROW_SELECT + """
        WHERE rbr.requested_by = :userId
        ORDER BY rbr.created_at DESC, rbr.borrow_request_id DESC
        """, nativeQuery = true)
    List<BorrowRequestProjection> findBorrowRequestsByUserId(@Param("userId") Integer userId);

    interface AvailableRoomProjection {
        Integer getClassroomId();

        String getRoomCode();

        Integer getCapacity();

        String getRoomType();

        String getRoomTypeText();

        String getMainEquipment();

        String getStatusText();
    }



    interface BorrowRequestProjection {
        Integer getId();

        String getRequestTitle();

        String getRequestType();

        String getBookingScope();

        Integer getSemesterId();

        LocalDate getBookingDate();

        Integer getSlot();

        Integer getSlotStartId();

        Integer getSlotEndId();

        Integer getSlotStart();

        Integer getSlotEnd();

        String getPeriodText();

        Integer getRequestedBy();


        

        Integer getExpectedAttendees();

        Integer getPreferredClassroomId();

        String getPreferredRoomCode();

        Integer getApprovedClassroomId();

        String getApprovedRoomCode();

        String getRequestedRoomType();

        String getPurposeNote();

        String getStatus();

        String getProcessingNote();

        String getRejectReason();

        LocalDateTime getApprovedAt();

        LocalDateTime getCreatedAt();
    }
}
