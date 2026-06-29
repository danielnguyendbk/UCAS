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

public interface StaffRoomBorrowRequestRepository extends JpaRepository<ClassSection, Integer> {

    String REQUEST_SELECT = """
        SELECT
            rbr.borrow_request_id AS id,
            rbr.request_title AS requestTitle,
            rbr.request_type AS requestType,
            rbr.booking_scope AS bookingScope,
            rbr.semester_id AS semesterId,
            sem.semester_name AS semesterName,
            rbr.booking_date AS bookingDate,
            rbr.slot_start_id AS slotStartId,
            rbr.slot_end_id AS slotEndId,
            ts_start.slot_no AS slotStart,
            ts_end.slot_no AS slotEnd,
            ts_start.slot_no AS slot,
            CASE
                WHEN ts_start.slot_no = ts_end.slot_no THEN CAST(ts_start.slot_no AS CHAR)
                ELSE CONCAT(ts_start.slot_no, '-', ts_end.slot_no)
            END AS periodText,
            rbr.requested_by AS requestedBy,
            requester.username AS requesterName,
            requester.username AS requesterUsername,
            requester.role AS requesterRole,
            rbr.section_id AS sectionId,
            CASE
                WHEN cs.section_id IS NULL THEN NULL
                ELSE CONCAT(course.course_code, '.L', cs.section_code)
            END AS sectionCode,
            course.course_name AS courseName,
            rbr.expected_attendees AS expectedAttendees,
            rbr.preferred_classroom_id AS preferredClassroomId,
            CASE
                WHEN preferred_room.classroom_id IS NULL THEN NULL
                ELSE CONCAT(preferred_building.building_code, '-', preferred_room.room_number)
            END AS preferredRoomCode,
            preferred_room.capacity AS preferredRoomCapacity,
            rbr.approved_classroom_id AS approvedClassroomId,
            CASE
                WHEN approved_room.classroom_id IS NULL THEN NULL
                ELSE CONCAT(approved_building.building_code, '-', approved_room.room_number)
            END AS approvedRoomCode,
            rbr.requested_room_type AS requestedRoomType,
            rbr.purpose_note AS purposeNote,
            rbr.status AS status,
            CASE
                WHEN rbr.status <> 'PENDING' THEN rbr.status
                WHEN rbr.preferred_classroom_id IS NULL THEN 'NO_ROOM'
                WHEN preferred_room.is_active = FALSE THEN 'ROOM_INACTIVE'
                WHEN preferred_room.capacity < rbr.expected_attendees THEN 'CAPACITY_LOW'
                WHEN EXISTS (
                    SELECT 1
                    FROM schedules sch
                    JOIN class_sections allocated_section ON allocated_section.section_id = sch.section_id
                    WHERE sch.classroom_id = rbr.preferred_classroom_id
                      AND sch.status = 'ASSIGNED'
                      AND allocated_section.status = 'ACTIVE'
                      AND allocated_section.semester_id = rbr.semester_id
                      AND sch.slot_start_id <= rbr.slot_end_id
                      AND sch.slot_end_id >= rbr.slot_start_id
                      AND sch.day_of_week = CASE DAYOFWEEK(rbr.booking_date)
                          WHEN 1 THEN 'SUN'
                          WHEN 2 THEN 'MON'
                          WHEN 3 THEN 'TUE'
                          WHEN 4 THEN 'WED'
                          WHEN 5 THEN 'THU'
                          WHEN 6 THEN 'FRI'
                          WHEN 7 THEN 'SAT'
                      END
                ) THEN 'CLASS_CONFLICT'
                WHEN EXISTS (
                    SELECT 1
                    FROM room_borrow_requests other_request
                    WHERE other_request.borrow_request_id <> rbr.borrow_request_id
                      AND other_request.approved_classroom_id = rbr.preferred_classroom_id
                      AND other_request.booking_date = rbr.booking_date
                      AND other_request.slot_start_id <= rbr.slot_end_id
                      AND other_request.slot_end_id >= rbr.slot_start_id
                      AND other_request.status = 'APPROVED'
                ) THEN 'BOOKING_CONFLICT'
                WHEN EXISTS (
                    SELECT 1
                    FROM temporary_room_changes trc
                    JOIN schedules sch ON sch.schedule_id = trc.schedule_id
                    JOIN semesters sem2 ON sem2.semester_id = trc.semester_id
                    WHERE trc.new_classroom_id = rbr.preferred_classroom_id
                      AND trc.status = 'APPROVED'
                      AND trc.is_active = TRUE
                      AND trc.semester_id = rbr.semester_id
                      AND sch.slot_start_id <= rbr.slot_end_id
                      AND sch.slot_end_id >= rbr.slot_start_id
                      AND sch.day_of_week = CASE DAYOFWEEK(rbr.booking_date)
                          WHEN 1 THEN 'SUN'
                          WHEN 2 THEN 'MON'
                          WHEN 3 THEN 'TUE'
                          WHEN 4 THEN 'WED'
                          WHEN 5 THEN 'THU'
                          WHEN 6 THEN 'FRI'
                          WHEN 7 THEN 'SAT'
                      END
                      AND (
                          (trc.change_scope = 'SESSION' AND trc.target_date = rbr.booking_date)
                          OR (
                              trc.change_scope IN ('WEEK_RANGE','REST_OF_SEMESTER')
                              AND FLOOR(DATEDIFF(rbr.booking_date, sem2.start_date) / 7) + 1
                                  BETWEEN trc.from_week AND COALESCE(trc.to_week, 999)
                          )
                      )
                ) THEN 'CHANGE_CONFLICT'
                ELSE 'AVAILABLE'
            END AS availabilityStatus,
            rbr.processing_note AS processingNote,
            rbr.reject_reason AS rejectReason,
            rbr.approved_by AS approvedBy,
            approver.username AS approvedByName,
            rbr.approved_at AS approvedAt,
            rbr.created_at AS createdAt
        """;

    String REQUEST_FROM = """
        FROM room_borrow_requests rbr
        JOIN semesters sem ON sem.semester_id = rbr.semester_id
        JOIN time_slots ts_start ON ts_start.slot_id = rbr.slot_start_id
        JOIN time_slots ts_end ON ts_end.slot_id = rbr.slot_end_id
        JOIN users requester ON requester.user_id = rbr.requested_by
        LEFT JOIN class_sections cs ON cs.section_id = rbr.section_id
        LEFT JOIN courses course ON course.course_id = cs.course_id
        LEFT JOIN classrooms preferred_room ON preferred_room.classroom_id = rbr.preferred_classroom_id
        LEFT JOIN buildings preferred_building ON preferred_building.building_id = preferred_room.building_id
        LEFT JOIN classrooms approved_room ON approved_room.classroom_id = rbr.approved_classroom_id
        LEFT JOIN buildings approved_building ON approved_building.building_id = approved_room.building_id
        LEFT JOIN users approver ON approver.user_id = rbr.approved_by
        """;

    @Query(value = REQUEST_SELECT + REQUEST_FROM + """
        WHERE (:status IS NULL OR :status = '' OR rbr.status = :status)
        ORDER BY
            CASE rbr.status
                WHEN 'PENDING' THEN 0
                WHEN 'APPROVED' THEN 1
                WHEN 'REJECTED' THEN 2
                ELSE 3
            END,
            rbr.created_at DESC
        """, nativeQuery = true)
    List<RequestProjection> findAllRequests(@Param("status") String status);

    @Query(value = REQUEST_SELECT + REQUEST_FROM + """
        WHERE rbr.borrow_request_id = :id
        """, nativeQuery = true)
    Optional<RequestProjection> findRequestById(@Param("id") Integer id);

    @Modifying
    @Query(value = """
        UPDATE room_borrow_requests
        SET status = 'APPROVED',
            approved_classroom_id = preferred_classroom_id,
            approved_by = :staffUserId,
            approved_at = CURRENT_TIMESTAMP,
            processing_note = :processingNote,
            reject_reason = NULL
        WHERE borrow_request_id = :id
          AND status = 'PENDING'
          AND preferred_classroom_id IS NOT NULL
        """, nativeQuery = true)
    int approvePendingRequest(
            @Param("id") Integer id,
            @Param("staffUserId") Integer staffUserId,
            @Param("processingNote") String processingNote
    );

    @Modifying
    @Query(value = """
        UPDATE room_borrow_requests
        SET status = 'REJECTED',
            approved_classroom_id = NULL,
            approved_by = NULL,
            approved_at = NULL,
            processing_note = :rejectReason,
            reject_reason = :rejectReason
        WHERE borrow_request_id = :id
          AND status = 'PENDING'
        """, nativeQuery = true)
    int rejectPendingRequest(
            @Param("id") Integer id,
            @Param("rejectReason") String rejectReason
    );

    interface RequestProjection {
        Integer getId();

        String getRequestTitle();

        String getRequestType();

        String getBookingScope();

        Integer getSemesterId();

        String getSemesterName();

        LocalDate getBookingDate();

        Integer getSlotStartId();

        Integer getSlotEndId();

        Integer getSlotStart();

        Integer getSlotEnd();

        Integer getSlot();

        String getPeriodText();

        Integer getRequestedBy();

        String getRequesterName();

        String getRequesterUsername();

        String getRequesterRole();


        

        Integer getSectionId();

        String getSectionCode();

        String getCourseName();

        Integer getExpectedAttendees();

        Integer getPreferredClassroomId();

        String getPreferredRoomCode();

        Integer getPreferredRoomCapacity();

        Integer getApprovedClassroomId();

        String getApprovedRoomCode();

        String getRequestedRoomType();

        String getPurposeNote();

        String getStatus();

        String getAvailabilityStatus();

        String getProcessingNote();

        String getRejectReason();

        Integer getApprovedBy();

        String getApprovedByName();

        LocalDateTime getApprovedAt();

        LocalDateTime getCreatedAt();
    }
}
