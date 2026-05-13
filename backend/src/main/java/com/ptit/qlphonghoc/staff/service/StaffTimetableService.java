package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.repository.StaffTimetableRepository;
import com.ptit.qlphonghoc.staff.dto.CreateTimetableSessionRequest;
import com.ptit.qlphonghoc.staff.dto.TimetableCellResponse;
import com.ptit.qlphonghoc.staff.dto.TimetableRoomGridResponse;
import com.ptit.qlphonghoc.staff.dto.TimetableSessionResponse;
import com.ptit.qlphonghoc.staff.dto.TimetableSlotGridResponse;
import com.ptit.qlphonghoc.staff.dto.UpdateTimetableSessionRequest;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class StaffTimetableService {

    private final StaffTimetableRepository staffTimetableRepository;

    public StaffTimetableService(StaffTimetableRepository staffTimetableRepository) {
        this.staffTimetableRepository = staffTimetableRepository;
    }

    @Transactional(readOnly = true)
    public List<TimetableSessionResponse> getTimetable(
            Integer semesterId,
            Integer sectionId,
            Integer classroomId,
            String day
    ) {
        String dayOfWeek = null;

        if (day != null && !day.isBlank()) {
            dayOfWeek = normalizeDay(day);
        }

        return staffTimetableRepository
                .findTimetable(semesterId, sectionId, classroomId, dayOfWeek)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TimetableRoomGridResponse> getTimetableGrid(
            Integer semesterId,
            Integer classroomId
    ) {
        List<StaffTimetableRepository.TimetableGridProjection> rows =
                staffTimetableRepository.findTimetableGrid(semesterId, classroomId);

        Map<Integer, TimetableRoomGridResponse> roomMap = new LinkedHashMap<>();
        Map<Integer, Map<Integer, TimetableSlotGridResponse>> roomSlotMap = new LinkedHashMap<>();

        for (StaffTimetableRepository.TimetableGridProjection row : rows) {
            TimetableRoomGridResponse roomResponse = roomMap.get(row.getClassroomId());

            if (roomResponse == null) {
                roomResponse = new TimetableRoomGridResponse();
                roomResponse.setClassroomId(row.getClassroomId());
                roomResponse.setRoom(row.getRoom());
                roomResponse.setBuildingCode(row.getBuildingCode());
                roomResponse.setSlots(new ArrayList<>());

                roomMap.put(row.getClassroomId(), roomResponse);
                roomSlotMap.put(row.getClassroomId(), new LinkedHashMap<>());
            }

            Map<Integer, TimetableSlotGridResponse> slotMap =
                    roomSlotMap.get(row.getClassroomId());

            TimetableSlotGridResponse slotResponse = slotMap.get(row.getSlot());

            if (slotResponse == null) {
                slotResponse = new TimetableSlotGridResponse();
                slotResponse.setSlot(row.getSlot());
                slotResponse.setPeriodText(row.getPeriodText());
                slotResponse.setDays(createEmptyDays());

                slotMap.put(row.getSlot(), slotResponse);
                roomResponse.getSlots().add(slotResponse);
            }

            if (row.getScheduleId() != null && row.getDayCode() != null) {
                TimetableCellResponse cell = new TimetableCellResponse();
                cell.setScheduleId(row.getScheduleId());
                cell.setSectionId(row.getSectionId());
                cell.setClassCode(row.getClassCode());
                cell.setCourseName(row.getCourseName());
                cell.setLecturerName(row.getLecturerName());
                cell.setStatusText(row.getStatusText());

                slotResponse.getDays().put(row.getDayCode(), cell);
            }
        }

        return new ArrayList<>(roomMap.values());
    }

    @Transactional(readOnly = true)
    public TimetableSessionResponse getByScheduleId(Integer scheduleId) {
        return staffTimetableRepository.findTimetableByScheduleId(scheduleId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy buổi học id = " + scheduleId
                ));
    }

    @Transactional
    public TimetableSessionResponse create(CreateTimetableSessionRequest request) {
        validateRequest(request);

        int activeScheduleCount = staffTimetableRepository
                .countActiveSchedulesBySectionId(request.getSectionId());

        if (activeScheduleCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Class-section này đã có buổi học trong thời khóa biểu."
            );
        }

        String dayOfWeek = normalizeDay(request.getDay());

        Integer timeSlotId = staffTimetableRepository
                .findTimeSlotIdBySlotNumber(request.getSlot())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không tồn tại slot = " + request.getSlot()
                ));

        Integer scheduleId = staffTimetableRepository.findScheduleId(
                request.getSectionId(),
                dayOfWeek,
                timeSlotId
        ).orElse(null);

        if (scheduleId == null) {
            staffTimetableRepository.insertSchedule(
                    request.getSectionId(),
                    dayOfWeek,
                    timeSlotId
            );

            scheduleId = staffTimetableRepository.findScheduleId(
                    request.getSectionId(),
                    dayOfWeek,
                    timeSlotId
            ).orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Tạo buổi học thất bại."
            ));
        } else {
            staffTimetableRepository.updateSchedule(
                    scheduleId,
                    request.getSectionId(),
                    dayOfWeek,
                    timeSlotId
            );
        }

        saveRoom(scheduleId, request.getClassroomId(), request.getAssignedBy(), request.getNote());

        return getByScheduleId(scheduleId);
    }

    @Transactional
    public TimetableSessionResponse update(Integer scheduleId, UpdateTimetableSessionRequest request) {
        int scheduleCount = staffTimetableRepository.countActiveScheduleById(scheduleId);

        if (scheduleCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy buổi học id = " + scheduleId
            );
        }

        validateRequest(request);

        int otherScheduleCount = staffTimetableRepository
                .countActiveSchedulesBySectionIdExceptSchedule(
                        request.getSectionId(),
                        scheduleId
                );

        if (otherScheduleCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Class-section này đã có buổi học khác trong thời khóa biểu."
            );
        }

        String dayOfWeek = normalizeDay(request.getDay());

        Integer timeSlotId = staffTimetableRepository
                .findTimeSlotIdBySlotNumber(request.getSlot())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không tồn tại slot = " + request.getSlot()
                ));

        staffTimetableRepository.deactivateRoomAllocationByScheduleId(scheduleId);

        staffTimetableRepository.updateSchedule(
                scheduleId,
                request.getSectionId(),
                dayOfWeek,
                timeSlotId
        );

        saveRoom(scheduleId, request.getClassroomId(), request.getAssignedBy(), request.getNote());

        return getByScheduleId(scheduleId);
    }

    @Transactional
    public void delete(Integer scheduleId) {
        int scheduleCount = staffTimetableRepository.countActiveScheduleById(scheduleId);

        if (scheduleCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy buổi học id = " + scheduleId
            );
        }

        staffTimetableRepository.deactivateRoomAllocationByScheduleId(scheduleId);
        staffTimetableRepository.deactivateScheduleById(scheduleId);
    }

    private void validateRequest(CreateTimetableSessionRequest request) {
        if (request.getSectionId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "sectionId không được để trống."
            );
        }

        int sectionCount = staffTimetableRepository.countActiveSectionById(request.getSectionId());

        if (sectionCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không tìm thấy class-section đang hoạt động id = " + request.getSectionId()
            );
        }

        if (request.getSlot() == null || request.getSlot() < 1 || request.getSlot() > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "slot chỉ nhận giá trị 1, 2, 3, 4, 5."
            );
        }

        if (request.getDay() == null || request.getDay().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "day không được để trống."
            );
        }

        if (request.getClassroomId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "classroomId không được để trống."
            );
        }

        int classroomCount = staffTimetableRepository
                .countActiveClassroomById(request.getClassroomId());

        if (classroomCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không tìm thấy phòng học đang hoạt động id = " + request.getClassroomId()
            );
        }

        if (request.getAssignedBy() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "assignedBy không được để trống."
            );
        }
    }

    private void saveRoom(
            Integer scheduleId,
            Integer classroomId,
            Integer assignedBy,
            String note
    ) {
        String finalNote = note;

        if (finalNote == null || finalNote.isBlank()) {
            finalNote = "Cập nhật thời khóa biểu cho buổi học id = " + scheduleId;
        }

        staffTimetableRepository.upsertRoomAllocation(
                scheduleId,
                classroomId,
                assignedBy,
                finalNote
        );
    }

    private Map<String, TimetableCellResponse> createEmptyDays() {
        Map<String, TimetableCellResponse> days = new LinkedHashMap<>();

        days.put("MON", null);
        days.put("TUE", null);
        days.put("WED", null);
        days.put("THU", null);
        days.put("FRI", null);
        days.put("SAT", null);

        return days;
    }

    private String normalizeDay(String rawDay) {
        String value = removeAccent(rawDay)
                .trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", " ");

        switch (value) {
            case "MON":
            case "MONDAY":
            case "T2":
            case "THU 2":
            case "2":
                return "MON";

            case "TUE":
            case "TUESDAY":
            case "T3":
            case "THU 3":
            case "3":
                return "TUE";

            case "WED":
            case "WEDNESDAY":
            case "T4":
            case "THU 4":
            case "4":
                return "WED";

            case "THU":
            case "THURSDAY":
            case "T5":
            case "THU 5":
            case "5":
                return "THU";

            case "FRI":
            case "FRIDAY":
            case "T6":
            case "THU 6":
            case "6":
                return "FRI";

            case "SAT":
            case "SATURDAY":
            case "T7":
            case "THU 7":
            case "7":
                return "SAT";

            case "SUN":
            case "SUNDAY":
            case "CN":
            case "CHU NHAT":
                return "SUN";

            default:
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "day không hợp lệ. Dùng MON/TUE/... hoặc Thứ 2/Thứ 3/..."
                );
        }
    }

    private String removeAccent(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
    }

    private TimetableSessionResponse toResponse(
            StaffTimetableRepository.TimetableSessionProjection projection
    ) {
        TimetableSessionResponse response = new TimetableSessionResponse();

        response.setScheduleId(projection.getScheduleId());
        response.setSectionId(projection.getSectionId());
        response.setClassCode(projection.getClassCode());
        response.setCourseName(projection.getCourseName());
        response.setLecturerName(projection.getLecturerName());
        response.setDay(projection.getDay());
        response.setDayCode(projection.getDayCode());
        response.setSlot(projection.getSlot());
        response.setPeriodText(projection.getPeriodText());
        response.setStartTime(projection.getStartTime());
        response.setEndTime(projection.getEndTime());
        response.setClassroomId(projection.getClassroomId());
        response.setRoom(projection.getRoom());
        response.setAllocationId(projection.getAllocationId());
        response.setAllocationStatus(projection.getAllocationStatus());
        response.setStatusText(projection.getStatusText());

        return response;
    }
}