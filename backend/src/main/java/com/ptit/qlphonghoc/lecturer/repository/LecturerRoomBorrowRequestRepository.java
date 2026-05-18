package com.ptit.qlphonghoc.lecturer.repository;

import com.ptit.qlphonghoc.lecturer.entity.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LecturerRoomBorrowRequestRepository extends JpaRepository<Lecturer, Integer> {

    @Query(value = """
        SELECT id
        FROM time_slots
        WHERE slot_number = :slotNumber
        """, nativeQuery = true)
    Optional<Integer> findTimeSlotIdBySlotNumber(@Param("slotNumber") Integer slotNumber);

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
        SELECT
            c.id AS clubId,
            c.club_code AS clubCode,
            c.club_name AS clubName,
            CASE WHEN c.advisor_user_id = :userId THEN 1 ELSE 0 END AS advisor
        FROM clubs c
        WHERE UPPER(c.club_code) = :clubCode
          AND c.status = 'ACTIVE'
          AND c.is_deleted = FALSE
        """, nativeQuery = true)
    Optional<ClubLookupProjection> findClubLookupByCode(
            @Param("clubCode") String clubCode,
            @Param("userId") Integer userId
    );

    @Query(value = """
        SELECT
            cs.id AS sectionId,
            CONCAT(c.course_code, '.', cs.section_code) AS sectionCode,
            c.course_name AS courseName,
            cs.max_capacity AS maxCapacity,
            cs.enrolled_count AS enrolledCount,
            c.required_room_type AS requiredRoomType
        FROM class_sections cs
        JOIN courses c ON c.id = cs.course_id
        WHERE cs.semester_id = :semesterId
          AND cs.lecturer_id = :lecturerId
          AND cs.status = 'ACTIVE'
          AND (
              UPPER(CONCAT(c.course_code, '.', cs.section_code)) = :sectionCode
              OR UPPER(CONCAT(c.course_code, cs.section_code)) = :sectionCode
              OR UPPER(CONCAT(c.course_code, '.L', cs.section_code)) = :sectionCode
              OR UPPER(CONCAT(c.course_code, 'L', cs.section_code)) = :sectionCode
              OR UPPER(CONCAT('L', cs.section_code)) = :sectionCode
              OR UPPER(cs.section_code) = :sectionCode
          )
        ORDER BY cs.id
        LIMIT 1
        """, nativeQuery = true)
    Optional<SectionLookupProjection> findSectionByCode(
            @Param("semesterId") Integer semesterId,
            @Param("lecturerId") Integer lecturerId,
            @Param("sectionCode") String sectionCode
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM class_sections
        WHERE id = :sectionId
          AND semester_id = :semesterId
          AND lecturer_id = :lecturerId
          AND status = 'ACTIVE'
        """, nativeQuery = true)
    int countValidLecturerSection(
            @Param("sectionId") Integer sectionId,
            @Param("semesterId") Integer semesterId,
            @Param("lecturerId") Integer lecturerId
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
            'Kha dung theo du lieu hien tai' AS statusText
        FROM classrooms cr
        JOIN buildings b ON b.id = cr.building_id
        WHERE cr.is_active = TRUE
          AND cr.capacity >= :expectedAttendees
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
        ORDER BY cr.capacity ASC, b.code, cr.room_number
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
            section_id,
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
            :requestType,
            :bookingScope,
            :semesterId,
            :sectionId,
            :bookingDate,
            :timeSlotId,
            :requestedBy,
            :clubId,
            :expectedAttendees,
            NULL,
            :preferredClassroomId,
            NULL,
            :purposeNote,
            'PENDING',
            NULL,
            NULL,
            NULL,
            NULL,
            NULL
        )
        """, nativeQuery = true)
    void insertBorrowRequest(
            @Param("requestTitle") String requestTitle,
            @Param("requestType") String requestType,
            @Param("bookingScope") String bookingScope,
            @Param("semesterId") Integer semesterId,
            @Param("sectionId") Integer sectionId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("timeSlotId") Integer timeSlotId,
            @Param("requestedBy") Integer requestedBy,
            @Param("clubId") Integer clubId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("preferredClassroomId") Integer preferredClassroomId,
            @Param("purposeNote") String purposeNote
    );

    @Query(value = "SELECT LAST_INSERT_ID()", nativeQuery = true)
    Integer getLastInsertId();

    @Query(value = """
        SELECT
            rbr.id AS id,
            rbr.request_title AS requestTitle,
            rbr.request_type AS requestType,
            rbr.booking_scope AS bookingScope,
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
            rbr.requested_by AS requestedBy,
            rbr.club_id AS clubId,
            cl.club_name AS clubName,
            rbr.section_id AS sectionId,
            CASE
                WHEN cs.id IS NULL THEN NULL
                ELSE CONCAT(co.course_code, '.', cs.section_code)
            END AS sectionCode,
            co.course_name AS courseName,
            cs.max_capacity AS sectionMaxCapacity,
            rbr.expected_attendees AS expectedAttendees,
            rbr.preferred_classroom_id AS preferredClassroomId,
            CONCAT(b.code, '-', cr.room_number) AS preferredRoomCode,
            rbr.approved_classroom_id AS approvedClassroomId,
            CASE
                WHEN approved_room.id IS NULL THEN NULL
                ELSE CONCAT(approved_building.code, '-', approved_room.room_number)
            END AS approvedRoomCode,
            rbr.purpose_note AS purposeNote,
            rbr.status AS status,
            rbr.processing_note AS processingNote,
            rbr.reject_reason AS rejectReason,
            rbr.approved_at AS approvedAt,
            rbr.created_at AS createdAt
        FROM room_borrow_requests rbr
        JOIN time_slots ts ON ts.id = rbr.time_slot_id
        LEFT JOIN clubs cl ON cl.id = rbr.club_id
        LEFT JOIN class_sections cs ON cs.id = rbr.section_id
        LEFT JOIN courses co ON co.id = cs.course_id
        LEFT JOIN classrooms cr ON cr.id = rbr.preferred_classroom_id
        LEFT JOIN buildings b ON b.id = cr.building_id
        LEFT JOIN classrooms approved_room ON approved_room.id = rbr.approved_classroom_id
        LEFT JOIN buildings approved_building ON approved_building.id = approved_room.building_id
        WHERE rbr.id = :id
        """, nativeQuery = true)
    Optional<BorrowRequestProjection> findBorrowRequestById(@Param("id") Integer id);

    @Query(value = """
        SELECT
            rbr.id AS id,
            rbr.request_title AS requestTitle,
            rbr.request_type AS requestType,
            rbr.booking_scope AS bookingScope,
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
            rbr.requested_by AS requestedBy,
            rbr.club_id AS clubId,
            cl.club_name AS clubName,
            rbr.section_id AS sectionId,
            CASE
                WHEN cs.id IS NULL THEN NULL
                ELSE CONCAT(co.course_code, '.', cs.section_code)
            END AS sectionCode,
            co.course_name AS courseName,
            cs.max_capacity AS sectionMaxCapacity,
            rbr.expected_attendees AS expectedAttendees,
            rbr.preferred_classroom_id AS preferredClassroomId,
            CONCAT(b.code, '-', cr.room_number) AS preferredRoomCode,
            rbr.approved_classroom_id AS approvedClassroomId,
            CASE
                WHEN approved_room.id IS NULL THEN NULL
                ELSE CONCAT(approved_building.code, '-', approved_room.room_number)
            END AS approvedRoomCode,
            rbr.purpose_note AS purposeNote,
            rbr.status AS status,
            rbr.processing_note AS processingNote,
            rbr.reject_reason AS rejectReason,
            rbr.approved_at AS approvedAt,
            rbr.created_at AS createdAt
        FROM room_borrow_requests rbr
        JOIN time_slots ts ON ts.id = rbr.time_slot_id
        LEFT JOIN clubs cl ON cl.id = rbr.club_id
        LEFT JOIN class_sections cs ON cs.id = rbr.section_id
        LEFT JOIN courses co ON co.id = cs.course_id
        LEFT JOIN classrooms cr ON cr.id = rbr.preferred_classroom_id
        LEFT JOIN buildings b ON b.id = cr.building_id
        LEFT JOIN classrooms approved_room ON approved_room.id = rbr.approved_classroom_id
        LEFT JOIN buildings approved_building ON approved_building.id = approved_room.building_id
        WHERE rbr.requested_by = :userId
        ORDER BY rbr.created_at DESC, rbr.id DESC
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

    interface ClubLookupProjection {
        Integer getClubId();

        String getClubCode();

        String getClubName();

        Number getAdvisor();
    }

    interface SectionLookupProjection {
        Integer getSectionId();

        String getSectionCode();

        String getCourseName();

        Integer getMaxCapacity();

        Integer getEnrolledCount();

        String getRequiredRoomType();
    }

    interface BorrowRequestProjection {
        Integer getId();

        String getRequestTitle();

        String getRequestType();

        String getBookingScope();

        Integer getSemesterId();

        LocalDate getBookingDate();

        Integer getSlot();

        String getPeriodText();

        Integer getRequestedBy();

        Integer getClubId();

        String getClubName();

        Integer getSectionId();

        String getSectionCode();

        String getCourseName();

        Integer getSectionMaxCapacity();

        Integer getExpectedAttendees();

        Integer getPreferredClassroomId();

        String getPreferredRoomCode();

        Integer getApprovedClassroomId();

        String getApprovedRoomCode();

        String getPurposeNote();

        String getStatus();

        String getProcessingNote();

        String getRejectReason();

        LocalDateTime getApprovedAt();

        LocalDateTime getCreatedAt();
    }
}
