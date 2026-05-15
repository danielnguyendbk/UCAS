package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.CreateEmergencyRoomChangeRequest;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeScheduleResponse;
import com.ptit.qlphonghoc.staff.repository.StaffEmergencyRoomChangeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
public class StaffEmergencyRoomChangeService {

    private static final int OPEN_ENDED_WEEK = 999;

    private final StaffEmergencyRoomChangeRepository repository;

    public StaffEmergencyRoomChangeService(StaffEmergencyRoomChangeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<EmergencyRoomChangeScheduleResponse> getSchedules(Integer semesterId) {
        if (semesterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "semesterId khong duoc de trong.");
        }

        return repository.findSchedulesBySemester(semesterId)
                .stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailableRoomResponse> findAvailableRooms(
            Integer semesterId,
            Integer scheduleId,
            String scope,
            LocalDate targetDate,
            Integer fromWeek,
            Integer toWeek,
            Integer expectedAttendees,
            String roomType,
            String keyword
    ) {
        StaffEmergencyRoomChangeRepository.ScheduleProjection schedule =
                findAndValidateSchedule(semesterId, scheduleId);
        ScopeWindow window = validateScope(scope, targetDate, fromWeek, toWeek, schedule);
        Integer attendees = expectedAttendees == null ? schedule.getMaxCapacity() : expectedAttendees;

        if (attendees == null || attendees <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "So nguoi du kien phai > 0.");
        }

        return repository.findAvailableRoomsForChange(
                        schedule.getSemesterId(),
                        schedule.getScheduleId(),
                        schedule.getCurrentClassroomId(),
                        schedule.getDayOfWeekCode(),
                        schedule.getTimeSlotId(),
                        attendees,
                        normalizeBlank(roomType),
                        normalizeBlank(keyword),
                        window.scope(),
                        window.targetDate(),
                        window.targetWeek(),
                        window.fromWeek(),
                        window.toWeekForConflict()
                )
                .stream()
                .map(this::toAvailableRoomResponse)
                .toList();
    }

    @Transactional
    public EmergencyRoomChangeResponse create(CreateEmergencyRoomChangeRequest request) {
        validateStaff(request.getStaffUserId());

        StaffEmergencyRoomChangeRepository.ScheduleProjection schedule =
                findAndValidateSchedule(request.getSemesterId(), request.getSectionScheduleId());
        ScopeWindow window = validateScope(
                request.getChangeScope(),
                request.getTargetDate(),
                request.getFromWeek(),
                request.getToWeek(),
                schedule
        );

        if (request.getNewClassroomId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "newClassroomId khong duoc de trong.");
        }

        if (request.getNewClassroomId().equals(schedule.getCurrentClassroomId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phong moi phai khac phong hien tai.");
        }

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason khong duoc de trong.");
        }

        int availableCount = repository.countAvailableRoomForChange(
                schedule.getSemesterId(),
                schedule.getScheduleId(),
                schedule.getCurrentClassroomId(),
                schedule.getDayOfWeekCode(),
                schedule.getTimeSlotId(),
                request.getNewClassroomId(),
                schedule.getMaxCapacity(),
                "",
                window.scope(),
                window.targetDate(),
                window.targetWeek(),
                window.fromWeek(),
                window.toWeekForConflict()
        );

        if (availableCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phong moi khong kha dung trong pham vi doi phong da chon."
            );
        }

        repository.insertApprovedEmergencyChange(
                schedule.getSemesterId(),
                schedule.getScheduleId(),
                window.scope(),
                window.targetDate(),
                window.fromWeek(),
                window.toWeekForStorage(),
                schedule.getCurrentClassroomId(),
                request.getNewClassroomId(),
                request.getReason().trim(),
                request.getStaffUserId(),
                "Doi phong khan cap, giao vu phe duyet va ap dung ngay."
        );

        Integer id = repository.getLastInsertId();

        return repository.findChangeById(id)
                .map(this::toChangeResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Tao doi phong khan cap that bai."
                ));
    }

    private StaffEmergencyRoomChangeRepository.ScheduleProjection findAndValidateSchedule(
            Integer semesterId,
            Integer scheduleId
    ) {
        if (semesterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "semesterId khong duoc de trong.");
        }
        if (scheduleId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sectionScheduleId khong duoc de trong.");
        }

        return repository.findScheduleDetail(semesterId, scheduleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Khong tim thay lich hoc da phan phong trong hoc ky da chon."
                ));
    }

    private void validateStaff(Integer staffUserId) {
        if (staffUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "staffUserId khong duoc de trong.");
        }

        int staffCount = repository.countActiveStaffOrAdminById(staffUserId);
        if (staffCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "staffUserId khong hop le hoac khong phai STAFF/ADMIN dang hoat dong."
            );
        }
    }

    private ScopeWindow validateScope(
            String rawScope,
            LocalDate targetDate,
            Integer fromWeek,
            Integer toWeek,
            StaffEmergencyRoomChangeRepository.ScheduleProjection schedule
    ) {
        String scope = normalizeScope(rawScope);
        int semesterWeeks = semesterWeeks(schedule.getSemesterStartDate(), schedule.getSemesterEndDate());

        if ("SESSION".equals(scope)) {
            if (targetDate == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetDate khong duoc de trong.");
            }
            if (targetDate.isBefore(schedule.getSemesterStartDate())
                    || targetDate.isAfter(schedule.getSemesterEndDate())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Ngay doi phong phai nam trong hoc ky da chon."
                );
            }
            if (!schedule.getDayOfWeekCode().equals(toDayCode(targetDate))) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Ngay doi phong phai trung voi thu hoc cua lop hoc phan."
                );
            }
            int targetWeek = weekOfSemester(schedule.getSemesterStartDate(), targetDate);
            return new ScopeWindow(scope, targetDate, null, null, targetWeek, targetWeek);
        }

        if (fromWeek == null || fromWeek <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fromWeek phai lon hon 0.");
        }
        if (fromWeek > semesterWeeks) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fromWeek vuot qua so tuan cua hoc ky.");
        }

        if ("WEEK_RANGE".equals(scope)) {
            if (toWeek == null || toWeek < fromWeek) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "toWeek phai lon hon hoac bang fromWeek.");
            }
            if (toWeek > semesterWeeks) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "toWeek vuot qua so tuan cua hoc ky.");
            }
            return new ScopeWindow(scope, null, fromWeek, toWeek, null, toWeek);
        }

        return new ScopeWindow(scope, null, fromWeek, null, null, semesterWeeks);
    }

    private String normalizeScope(String rawScope) {
        if (rawScope == null || rawScope.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "changeScope khong duoc de trong.");
        }

        String scope = rawScope.trim().toUpperCase(Locale.ROOT);
        if (!scope.equals("SESSION") && !scope.equals("WEEK_RANGE") && !scope.equals("REST_OF_SEMESTER")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "changeScope chi nhan SESSION, WEEK_RANGE hoac REST_OF_SEMESTER."
            );
        }
        return scope;
    }

    private int semesterWeeks(LocalDate startDate, LocalDate endDate) {
        long days = ChronoUnit.DAYS.between(startDate, endDate);
        return (int) Math.floor(days / 7.0) + 1;
    }

    private int weekOfSemester(LocalDate startDate, LocalDate date) {
        long days = ChronoUnit.DAYS.between(startDate, date);
        return (int) Math.floor(days / 7.0) + 1;
    }

    private String toDayCode(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        return switch (dayOfWeek) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
    }

    private String normalizeBlank(String value) {
        return value == null ? "" : value.trim();
    }

    private EmergencyRoomChangeScheduleResponse toScheduleResponse(
            StaffEmergencyRoomChangeRepository.ScheduleProjection projection
    ) {
        EmergencyRoomChangeScheduleResponse response = new EmergencyRoomChangeScheduleResponse();
        response.setScheduleId(projection.getScheduleId());
        response.setSemesterId(projection.getSemesterId());
        response.setSectionId(projection.getSectionId());
        response.setClassCode(projection.getClassCode());
        response.setCourseName(projection.getCourseName());
        response.setLecturerName(projection.getLecturerName());
        response.setDayOfWeekCode(projection.getDayOfWeekCode());
        response.setDayOfWeekText(projection.getDayOfWeekText());
        response.setSlotNumber(projection.getSlotNumber());
        response.setCurrentClassroomId(projection.getCurrentClassroomId());
        response.setCurrentRoomCode(projection.getCurrentRoomCode());
        response.setMaxCapacity(projection.getMaxCapacity());
        response.setRequiredRoomType(projection.getRequiredRoomType());
        return response;
    }

    private AvailableRoomResponse toAvailableRoomResponse(
            StaffEmergencyRoomChangeRepository.AvailableRoomProjection projection
    ) {
        AvailableRoomResponse response = new AvailableRoomResponse();
        response.setClassroomId(projection.getClassroomId());
        response.setRoomCode(projection.getRoomCode());
        response.setCapacity(projection.getCapacity());
        response.setRoomType(projection.getRoomType());
        response.setRoomTypeText(projection.getRoomTypeText());
        response.setMainEquipment(projection.getMainEquipment());
        response.setStatusText(projection.getStatusText());
        return response;
    }

    private EmergencyRoomChangeResponse toChangeResponse(
            StaffEmergencyRoomChangeRepository.ChangeProjection projection
    ) {
        EmergencyRoomChangeResponse response = new EmergencyRoomChangeResponse();
        response.setId(projection.getId());
        response.setSemesterId(projection.getSemesterId());
        response.setSectionScheduleId(projection.getSectionScheduleId());
        response.setClassCode(projection.getClassCode());
        response.setCourseName(projection.getCourseName());
        response.setLecturerName(projection.getLecturerName());
        response.setDayOfWeek(projection.getDayOfWeek());
        response.setSlot(projection.getSlot());
        response.setChangeScope(projection.getChangeScope());
        response.setTargetDate(projection.getTargetDate());
        response.setFromWeek(projection.getFromWeek());
        response.setToWeek(projection.getToWeek());
        response.setOldClassroomId(projection.getOldClassroomId());
        response.setOldRoomCode(projection.getOldRoomCode());
        response.setNewClassroomId(projection.getNewClassroomId());
        response.setNewRoomCode(projection.getNewRoomCode());
        response.setReason(projection.getReason());
        response.setStatus(projection.getStatus());
        response.setActive(projection.getActive());
        response.setReviewedBy(projection.getReviewedBy());
        return response;
    }

    private record ScopeWindow(
            String scope,
            LocalDate targetDate,
            Integer fromWeek,
            Integer toWeekForStorage,
            Integer targetWeek,
            Integer toWeekForConflict
    ) {
    }
}
