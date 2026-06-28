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
            rbr.club_id AS clubId,
            cl.club_name AS clubName,
            rbr.section_id AS sectionId,
            CASE
                WHEN cs.section_id IS NULL THEN NULL
                ELSE CONCAT(co.course_code, '.', cs.section_code)
            END AS sectionCode,
            co.course_name AS courseName,
            cs.max_capacity AS sectionMaxCapacity,
            rbr.expected_attendees AS expectedAttendees,
            rbr.preferred_classroom_id AS preferredClassroomId,
            CONCAT(b.building_code, '-', cr.room_number) AS preferredRoomCode,
            rbr.approved_classroom_id AS approvedClassroomId,
            CASE
                WHEN approved_room.classroom_id IS NULL THEN NULL
                ELSE CONCAT(approved_building.building_code, '-', approved_room.room_number)
            END AS approvedRoomCode,
            rbr.purpose_note AS purposeNote,
            rbr.status AS status,
            rbr.processing_note AS processingNote,
            rbr.reject_reason AS rejectReason,
            rbr.approved_at AS approvedAt,
            rbr.created_at AS createdAt
        FROM room_borrow_requests rbr
        JOIN time_slots ts_start ON ts_start.slot_id = rbr.slot_start_id
        JOIN time_slots ts_end ON ts_end.slot_id = rbr.slot_end_id
        LEFT JOIN clubs cl ON cl.club_id = rbr.club_id
        LEFT JOIN class_sections cs ON cs.section_id = rbr.section_id
        LEFT JOIN courses co ON co.course_id = cs.course_id
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
          AND status = 'ACTIVE'
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
          AND (:buildingId IS NULL OR building_id = :buildingId)
          AND (:roomType IS NULL OR :roomType = '' OR room_type = :roomType)
        """, nativeQuery = true)
    int countUsableClassroom(
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("buildingId") Integer buildingId,
            @Param("roomType") String roomType
    );

    @Query(value = """
        SELECT
            c.club_id AS clubId,
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
            cs.section_id AS sectionId,
            CONCAT(c.course_code, '.', cs.section_code) AS sectionCode,
            c.course_name AS courseName,
            cs.max_capacity AS maxCapacity,
            cs.enrolled_count AS enrolledCount,
            c.required_room_type AS requiredRoomType
        FROM class_sections cs
        JOIN courses c ON c.course_id = cs.course_id
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
        ORDER BY cs.section_id
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
        WHERE section_id = :sectionId
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
            cr.classroom_id AS classroomId,
            b.building_id AS buildingId,
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
            END AS mainEquipment,
            'Kha dung theo du lieu hien tai' AS statusText
        FROM classrooms cr
        JOIN buildings b ON b.building_id = cr.building_id
        WHERE cr.is_active = TRUE
          AND cr.is_deleted = FALSE
          AND cr.capacity >= :expectedAttendees
          AND (:buildingId IS NULL OR cr.building_id = :buildingId)
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
        ORDER BY cr.capacity ASC, b.building_code, cr.room_number
        """, nativeQuery = true)
    List<AvailableRoomProjection> findAvailableRooms(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("buildingId") Integer buildingId,
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
        """, nativeQuery = true)
    int countAvailableClassroom(
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("classroomId") Integer classroomId,
            @Param("expectedAttendees") Integer expectedAttendees
    );

    @Query(value = """
        SELECT COUNT(*)
        FROM room_borrow_requests
        WHERE requested_by = :userId
          AND semester_id = :semesterId
          AND booking_date = :bookingDate
          AND slot_start_id = :slotStartId
          AND slot_end_id = :slotEndId
          AND preferred_classroom_id = :preferredClassroomId
          AND (:sectionId IS NULL OR section_id = :sectionId)
          AND status = 'PENDING'
        """, nativeQuery = true)
    int countDuplicatePendingBorrowRequest(
            @Param("userId") Integer userId,
            @Param("semesterId") Integer semesterId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("preferredClassroomId") Integer preferredClassroomId,
            @Param("sectionId") Integer sectionId
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
            :requestType,
            :bookingScope,
            :semesterId,
            :sectionId,
            :bookingDate,
            start_slot.slot_id,
            end_slot.slot_id,
            start_slot.start_time,
            end_slot.end_time,
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
        FROM time_slots start_slot
        JOIN time_slots end_slot ON end_slot.slot_id = :slotEndId
        WHERE start_slot.slot_id = :slotStartId
        """, nativeQuery = true)
    void insertBorrowRequest(
            @Param("requestTitle") String requestTitle,
            @Param("requestType") String requestType,
            @Param("bookingScope") String bookingScope,
            @Param("semesterId") Integer semesterId,
            @Param("sectionId") Integer sectionId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("slotStartId") Integer slotStartId,
            @Param("slotEndId") Integer slotEndId,
            @Param("requestedBy") Integer requestedBy,
            @Param("clubId") Integer clubId,
            @Param("expectedAttendees") Integer expectedAttendees,
            @Param("preferredClassroomId") Integer preferredClassroomId,
            @Param("purposeNote") String purposeNote
    );

    @Query(value = "SELECT LAST_INSERT_ID()", nativeQuery = true)
    Integer getLastInsertId();

    @Query(value = BORROW_SELECT + """
        WHERE rbr.borrow_request_id = :id
        """, nativeQuery = true)
    Optional<BorrowRequestProjection> findBorrowRequestById(@Param("id") Integer id);

    @Modifying
    @Query(value = """
        UPDATE room_borrow_requests
        SET status = 'CANCELLED',
            processing_note = 'Nguoi gui da huy yeu cau'
        WHERE borrow_request_id = :id
          AND requested_by = :userId
          AND status = 'PENDING'
        """, nativeQuery = true)
    int cancelPendingBorrowRequest(@Param("id") Integer id, @Param("userId") Integer userId);

    @Query(value = BORROW_SELECT + """
        WHERE rbr.requested_by = :userId
        ORDER BY rbr.created_at DESC, rbr.borrow_request_id DESC
        """, nativeQuery = true)
    List<BorrowRequestProjection> findBorrowRequestsByUserId(@Param("userId") Integer userId);

    interface AvailableRoomProjection {
        Integer getClassroomId();

        Integer getBuildingId();

        String getBuildingCode();

        String getBuildingName();

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

        Integer getSlotStartId();

        Integer getSlotEndId();

        Integer getSlotStart();

        Integer getSlotEnd();

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
