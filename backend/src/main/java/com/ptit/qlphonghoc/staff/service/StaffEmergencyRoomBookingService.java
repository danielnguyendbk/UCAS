package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.repository.StaffEmergencyRoomBookingRepository;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.CreateEmergencyRoomBookingRequest;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.EmergencyRoomBookingResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class StaffEmergencyRoomBookingService {

    private final StaffEmergencyRoomBookingRepository repository;

    public StaffEmergencyRoomBookingService(
            StaffEmergencyRoomBookingRepository repository
    ) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AvailableRoomResponse> findAvailableRooms(
            Integer semesterId,
            LocalDate bookingDate,
            Integer slot,
            Integer expectedAttendees,
            String roomType,
            String keyword
    ) {
        validateSearchInput(semesterId, bookingDate, slot, expectedAttendees);

        Integer timeSlotId = repository.findTimeSlotIdBySlotNumber(slot)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không tồn tại slot = " + slot
                ));

        String dayOfWeek = toDayCode(bookingDate);

        String normalizedRoomType = normalizeRoomType(roomType);
        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        return repository.findAvailableRooms(
                        semesterId,
                        bookingDate,
                        dayOfWeek,
                        timeSlotId,
                        expectedAttendees,
                        normalizedRoomType,
                        normalizedKeyword
                )
                .stream()
                .map(this::toAvailableRoomResponse)
                .toList();
    }

    @Transactional
    public EmergencyRoomBookingResponse create(
            CreateEmergencyRoomBookingRequest request
    ) {
        validateCreateInput(request);

        Integer timeSlotId = repository.findTimeSlotIdBySlotNumber(request.getSlot())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không tồn tại slot = " + request.getSlot()
                ));

        String dayOfWeek = toDayCode(request.getBookingDate());

        int availableCount = repository.countAvailableClassroomForEmergency(
                request.getSemesterId(),
                request.getBookingDate(),
                dayOfWeek,
                timeSlotId,
                request.getClassroomId(),
                request.getExpectedAttendees()
        );

        if (availableCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phòng không khả dụng: có thể đã trùng lịch, không đủ sức chứa hoặc không hoạt động."
            );
        }

        String requestTitle = "Đặt phòng khẩn cấp - " + request.getRecipientName();

        String purposeNote = buildPurposeNote(request);

        String processingNote = buildProcessingNote(request);

        repository.insertEmergencyBooking(
                requestTitle,
                request.getSemesterId(),
                request.getBookingDate(),
                timeSlotId,
                request.getStaffUserId(),
                request.getExpectedAttendees(),
                request.getClassroomId(),
                purposeNote,
                processingNote
        );

        Integer id = repository.getLastInsertId();

        return repository.findEmergencyBookingById(id)
                .map(projection -> toEmergencyResponse(projection, request))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Tạo đặt phòng khẩn cấp thất bại."
                ));
    }

    private void validateSearchInput(
            Integer semesterId,
            LocalDate bookingDate,
            Integer slot,
            Integer expectedAttendees
    ) {
        if (semesterId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "semesterId không được để trống."
            );
        }

        if (bookingDate == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "bookingDate không được để trống."
            );
        }

        if (slot == null || slot < 1 || slot > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "slot chỉ nhận giá trị 1, 2, 3, 4, 5."
            );
        }

        if (expectedAttendees == null || expectedAttendees <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "expectedAttendees phải > 0."
            );
        }

        int validSemesterDate = repository.countValidSemesterDate(
                semesterId,
                bookingDate
        );

        if (validSemesterDate == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày sử dụng không nằm trong học kỳ đã chọn."
            );
        }
    }

    private void validateCreateInput(CreateEmergencyRoomBookingRequest request) {
        validateSearchInput(
                request.getSemesterId(),
                request.getBookingDate(),
                request.getSlot(),
                request.getExpectedAttendees()
        );

        if (request.getTargetType() == null || request.getTargetType().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "targetType không được để trống."
            );
        }

        String targetType = request.getTargetType().trim().toUpperCase(Locale.ROOT);

        if (!targetType.equals("STUDENT")
                && !targetType.equals("LECTURER")
                && !targetType.equals("CLASS")
                && !targetType.equals("DEPARTMENT")
                && !targetType.equals("CLUB")
                && !targetType.equals("OTHER")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "targetType chỉ nhận STUDENT, LECTURER, CLASS, DEPARTMENT, CLUB hoặc OTHER."
            );
        }

        if (request.getRecipientName() == null || request.getRecipientName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "recipientName không được để trống."
            );
        }

        if (request.getClassroomId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "classroomId không được để trống."
            );
        }

        if (request.getPurpose() == null || request.getPurpose().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "purpose không được để trống."
            );
        }

        if (request.getEmergencyReason() == null || request.getEmergencyReason().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "emergencyReason không được để trống."
            );
        }

        if (request.getStaffUserId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "staffUserId không được để trống."
            );
        }

        int staffCount = repository.countActiveStaffOrAdminById(request.getStaffUserId());

        if (staffCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "staffUserId không hợp lệ hoặc không phải STAFF/ADMIN đang hoạt động."
            );
        }

        int classroomCount = repository.countUsableClassroom(
                request.getClassroomId(),
                request.getExpectedAttendees()
        );

        if (classroomCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phòng không tồn tại, không hoạt động hoặc không đủ sức chứa."
            );
        }
    }

    private String normalizeRoomType(String roomType) {
        if (roomType == null || roomType.isBlank()) {
            return "";
        }

        return roomType.trim().toUpperCase(Locale.ROOT);
    }

    private String toDayCode(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();

        switch (dayOfWeek) {
            case MONDAY:
                return "MON";
            case TUESDAY:
                return "TUE";
            case WEDNESDAY:
                return "WED";
            case THURSDAY:
                return "THU";
            case FRIDAY:
                return "FRI";
            case SATURDAY:
                return "SAT";
            case SUNDAY:
                return "SUN";
            default:
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Ngày sử dụng không hợp lệ."
                );
        }
    }

    private String buildPurposeNote(CreateEmergencyRoomBookingRequest request) {
        String recipientCode = request.getRecipientCode();

        if (recipientCode == null || recipientCode.isBlank()) {
            recipientCode = "-";
        }

        return "Đối tượng: " + request.getTargetType().trim().toUpperCase(Locale.ROOT)
                + "\nTên: " + request.getRecipientName().trim()
                + "\nMã số: " + recipientCode
                + "\nMục đích: " + request.getPurpose().trim();
    }

    private String buildProcessingNote(CreateEmergencyRoomBookingRequest request) {
        return "ĐẶT PHÒNG KHẨN CẤP"
                + "\nLý do khẩn cấp: " + request.getEmergencyReason().trim();
    }

    private AvailableRoomResponse toAvailableRoomResponse(
            StaffEmergencyRoomBookingRepository.AvailableRoomProjection projection
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

    private EmergencyRoomBookingResponse toEmergencyResponse(
            StaffEmergencyRoomBookingRepository.EmergencyBookingProjection projection,
            CreateEmergencyRoomBookingRequest request
    ) {
        EmergencyRoomBookingResponse response = new EmergencyRoomBookingResponse();

        response.setId(projection.getId());
        response.setRequestTitle(projection.getRequestTitle());
        response.setTargetType(request.getTargetType());
        response.setRecipientName(request.getRecipientName());
        response.setRecipientCode(request.getRecipientCode());
        response.setSemesterId(projection.getSemesterId());
        response.setBookingDate(projection.getBookingDate());
        response.setSlot(projection.getSlot());
        response.setPeriodText(projection.getPeriodText());
        response.setClassroomId(projection.getClassroomId());
        response.setRoomCode(projection.getRoomCode());
        response.setExpectedAttendees(projection.getExpectedAttendees());
        response.setPurpose(request.getPurpose());
        response.setEmergencyReason(request.getEmergencyReason());
        response.setStatus(projection.getStatus());
        response.setApprovedBy(projection.getApprovedBy());

        return response;
    }
}