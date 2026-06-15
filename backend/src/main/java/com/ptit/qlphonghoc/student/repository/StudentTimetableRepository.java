package com.ptit.qlphonghoc.student.repository;

import com.ptit.qlphonghoc.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudentTimetableRepository extends JpaRepository<Student, Integer> {

    @Query(value = """
        SELECT
            sch.schedule_id AS id,
            sch.schedule_id AS scheduleId,
            cs.section_id AS sectionId,
            cs.semester_id AS semesterId,
            c.course_code AS courseCode,
            c.course_name AS courseName,
            cs.section_code AS sectionCode,
            CONCAT(c.course_code, '.L', cs.section_code) AS classCode,
            c.credits AS credits,
            l.full_name AS lecturerName,
            cr.classroom_id AS roomId,
            CASE
                WHEN cr.classroom_id IS NULL THEN NULL
                ELSE CONCAT(b.building_code, '-', cr.room_number)
            END AS roomCode,
            cr.classroom_name AS roomName,
            b.building_code AS buildingCode,
            b.building_name AS buildingName,
            sch.day_of_week AS dayCode,
            CASE sch.day_of_week
                WHEN 'MON' THEN 'Thu 2'
                WHEN 'TUE' THEN 'Thu 3'
                WHEN 'WED' THEN 'Thu 4'
                WHEN 'THU' THEN 'Thu 5'
                WHEN 'FRI' THEN 'Thu 6'
                WHEN 'SAT' THEN 'Thu 7'
                WHEN 'SUN' THEN 'Chu nhat'
            END AS dayOfWeek,
            sch.slot_start_id AS slotStartId,
            sch.slot_end_id AS slotEndId,
            ts_start.slot_no AS slotStart,
            ts_end.slot_no AS slotEnd,
            CASE
                WHEN ts_start.slot_no = ts_end.slot_no THEN CONCAT('Tiet ', ts_start.slot_no)
                ELSE CONCAT('Tiet ', ts_start.slot_no, '-', ts_end.slot_no)
            END AS timeSlotName,
            DATE_FORMAT(sch.start_time, '%H:%i') AS startTime,
            DATE_FORMAT(sch.end_time, '%H:%i') AS endTime,
            sch.from_week_no AS fromWeekNo,
            sch.to_week_no AS toWeekNo,
            sch.status AS status
        FROM students s
        JOIN student_section_enrollments sse ON sse.student_id = s.student_id
        JOIN class_sections cs ON cs.section_id = sse.section_id
        JOIN courses c ON c.course_id = cs.course_id
        JOIN lecturers l ON l.lecturer_id = cs.lecturer_id
        JOIN schedules sch ON sch.section_id = cs.section_id
        JOIN time_slots ts_start ON ts_start.slot_id = sch.slot_start_id
        JOIN time_slots ts_end ON ts_end.slot_id = sch.slot_end_id
        LEFT JOIN classrooms cr ON cr.classroom_id = sch.classroom_id
        LEFT JOIN buildings b ON b.building_id = cr.building_id
        WHERE s.user_id = :userId
          AND s.is_deleted = FALSE
          AND sse.status = 'ENROLLED'
          AND cs.status = 'ACTIVE'
          AND sch.status <> 'CANCELLED'
          AND (:semesterId IS NULL OR cs.semester_id = :semesterId)
          AND (
              :weekNo IS NULL
              OR (
                  (sch.from_week_no IS NULL OR sch.from_week_no <= :weekNo)
                  AND (sch.to_week_no IS NULL OR sch.to_week_no >= :weekNo)
              )
          )
        ORDER BY
            FIELD(sch.day_of_week, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'),
            ts_start.slot_no,
            c.course_code,
            cs.section_code
        """, nativeQuery = true)
    List<StudentTimetableProjection> findTimetableByUserId(
            @Param("userId") Integer userId,
            @Param("semesterId") Integer semesterId,
            @Param("weekNo") Integer weekNo
    );

    @Query(value = """
        SELECT sw.week_no
        FROM semester_weeks sw
        JOIN semesters sem ON sem.semester_id = sw.semester_id
        WHERE (:semesterId IS NULL OR sw.semester_id = :semesterId)
          AND :weekStartDate BETWEEN sw.start_date AND sw.end_date
          AND sem.is_deleted = FALSE
        ORDER BY
            CASE sem.status
                WHEN 'ACTIVE' THEN 0
                WHEN 'UPCOMING' THEN 1
                WHEN 'COMPLETED' THEN 2
                ELSE 3
            END,
            sem.start_date DESC
        LIMIT 1
        """, nativeQuery = true)
    Optional<Integer> findWeekNo(
            @Param("semesterId") Integer semesterId,
            @Param("weekStartDate") LocalDate weekStartDate
    );

    interface StudentTimetableProjection {
        Integer getId();

        Integer getScheduleId();

        Integer getSectionId();

        Integer getSemesterId();

        String getCourseCode();

        String getCourseName();

        String getSectionCode();

        String getClassCode();

        Integer getCredits();

        String getLecturerName();

        Integer getRoomId();

        String getRoomCode();

        String getRoomName();

        String getBuildingCode();

        String getBuildingName();

        String getDayCode();

        String getDayOfWeek();

        Integer getSlotStartId();

        Integer getSlotEndId();

        Integer getSlotStart();

        Integer getSlotEnd();

        String getTimeSlotName();

        String getStartTime();

        String getEndTime();

        Integer getFromWeekNo();

        Integer getToWeekNo();

        String getStatus();
    }
}
