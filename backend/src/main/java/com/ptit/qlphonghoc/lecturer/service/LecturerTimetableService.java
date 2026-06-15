package com.ptit.qlphonghoc.lecturer.service;

import com.ptit.qlphonghoc.lecturer.dto.timetable.LecturerTimetableResponse;
import com.ptit.qlphonghoc.lecturer.entity.Lecturer;
import com.ptit.qlphonghoc.lecturer.repository.LecturerRepository;
import com.ptit.qlphonghoc.lecturer.repository.LecturerTimetableRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class LecturerTimetableService {

    private final LecturerRepository lecturerRepository;
    private final LecturerTimetableRepository timetableRepository;

    public LecturerTimetableService(
            LecturerRepository lecturerRepository,
            LecturerTimetableRepository timetableRepository
    ) {
        this.lecturerRepository = lecturerRepository;
        this.timetableRepository = timetableRepository;
    }

    @Transactional(readOnly = true)
    public List<LecturerTimetableResponse> getMyTimetable(
            Integer userId,
            Integer semesterId,
            LocalDate weekStartDate
    ) {
        Lecturer lecturer = ensureLecturerProfile(userId);

        // schedules stores weekly templates; weekStartDate filters by semester week only when semester_weeks has data.
        Integer weekNo = weekStartDate == null
                ? null
                : timetableRepository.findWeekNo(semesterId, weekStartDate).orElse(null);

        return timetableRepository.findTimetableByLecturerId(lecturer.getId(), semesterId, weekNo)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Lecturer ensureLecturerProfile(Integer userId) {
        return lecturerRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Lecturer profile not found."
                ));
    }

    private LecturerTimetableResponse toResponse(
            LecturerTimetableRepository.LecturerTimetableProjection projection
    ) {
        return new LecturerTimetableResponse(
                projection.getId(),
                projection.getScheduleId(),
                projection.getSectionId(),
                projection.getSemesterId(),
                projection.getCourseCode(),
                projection.getCourseName(),
                projection.getSectionCode(),
                projection.getClassCode(),
                projection.getClassName(),
                projection.getCredits(),
                projection.getStudentCount(),
                projection.getMaxCapacity(),
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
