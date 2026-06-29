package com.ptit.qlphonghoc.student.service;

import com.ptit.qlphonghoc.student.dto.timetable.StudentTimetableResponse;
import com.ptit.qlphonghoc.student.entity.Student;
import com.ptit.qlphonghoc.student.repository.StudentRepository;
import com.ptit.qlphonghoc.student.repository.StudentTimetableRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class StudentTimetableService {

    private final StudentRepository studentRepository;
    private final StudentTimetableRepository timetableRepository;

    public StudentTimetableService(
            StudentRepository studentRepository,
            StudentTimetableRepository timetableRepository
    ) {
        this.studentRepository = studentRepository;
        this.timetableRepository = timetableRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentTimetableResponse> getMyTimetable(
            Integer userId,
            Integer semesterId,
            LocalDate weekStartDate
    ) {
        ensureStudentProfile(userId);

        // schedules stores weekly templates; weekStartDate filters by semester week only when semester_weeks has data.
        Integer weekNo = weekStartDate == null
                ? null
                : timetableRepository.findWeekNo(semesterId, weekStartDate).orElse(null);

        return timetableRepository.findTimetableByUserId(userId, semesterId, weekNo)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Student ensureStudentProfile(Integer userId) {
        return studentRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Student profile not found."
                ));
    }

    private StudentTimetableResponse toResponse(
            StudentTimetableRepository.StudentTimetableProjection projection
    ) {
        return new StudentTimetableResponse(
                projection.getId(),
                projection.getScheduleId(),
                projection.getSectionId(),
                projection.getSemesterId(),
                projection.getCourseCode(),
                projection.getCourseName(),
                projection.getSectionCode(),
                projection.getClassCode(),
                projection.getCredits(),
                projection.getLecturerName(),
                projection.getRoomId(),
                projection.getRoomCode(),
                projection.getRoomName(),
                projection.getBuildingCode(),
                projection.getBuildingName(),
                projection.getDayCode(),
                projection.getDayOfWeek(),
                projection.getSlotStartId(),
                projection.getSlotEndId(),
                projection.getSlotStart(),
                projection.getSlotEnd(),
                projection.getTimeSlotName(),
                projection.getStartTime(),
                projection.getEndTime(),
                projection.getFromWeekNo(),
                projection.getToWeekNo(),
                projection.getStatus()
        );
    }
}
