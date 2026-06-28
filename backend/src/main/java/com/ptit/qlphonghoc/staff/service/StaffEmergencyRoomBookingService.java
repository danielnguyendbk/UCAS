package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.CreateEmergencyRoomBookingRequest;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.EmergencyRoomBookingResponse;
import com.ptit.qlphonghoc.staff.repository.StaffEmergencyRoomBookingRepository;
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

    public StaffEmergencyRoomBookingService(StaffEmergencyRoomBookingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AvailableRoomResponse> findAvailableRooms(
            Integer semesterId,
            LocalDate bookingDate,
            Integer slotStartId,
            Integer slotEndId,
            Integer expectedAttendees,
            String roomType,
            String keyword
    ) {
        validateSearchInput(semesterId, bookingDate, slotStartId, slotEndId, expectedAttendees);

        String dayOfWeek = toDayCode(bookingDate);
        String normalizedRoomType = normalizeRoomType(roomType);
        String normalizedKeyword = keyword == null ? "" : keyword.trim();

        return repository.findAvailableRooms(
                        semesterId,
                        bookingDate,
                        dayOfWeek,
                        slotStartId,
                        slotEndId,
                        expectedAttendees,
                        normalizedRoomType,
                        normalizedKeyword
                )
                .stream()
                .map(this::toAvailableRoomResponse)
                .toList();
    }

    @Transactional
    public EmergencyRoomBookingResponse create(CreateEmergencyRoomBookingRequest request, Integer staffUserId) {
        Integer slotStartId = effectiveSlotStartId(request);
        Integer slotEndId = effectiveSlotEndId(request, slotStartId);

        validateCreateInput(request, staffUserId, slotStartId, slotEndId);

        String dayOfWeek = toDayCode(request.getBookingDate());
        int availableCount = repository.countAvailableClassroomForEmergency(
                request.getSemesterId(),
                request.getBookingDate(),
                dayOfWeek,
                slotStartId,
                slotEndId,
                request.getClassroomId(),
                request.getExpectedAttendees()
        );

        if (availableCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phong khong kha dung: co the da trung lich, khong du suc chua hoac khong hoat dong."
            );
        }

        String requestTitle = "Dat phong khan cap - " + request.getRecipientName();
        String purposeNote = buildPurposeNote(request);
        String processingNote = buildProcessingNote(request);

        repository.insertEmergencyBooking(
                requestTitle,
                request.getSemesterId(),
                request.getBookingDate(),
                slotStartId,
                slotEndId,
                staffUserId,
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
                        "Tao dat phong khan cap that bai."
                ));
    }

    private Integer effectiveSlotStartId(CreateEmergencyRoomBookingRequest request) {
        return request.getSlotStartId() != null ? request.getSlotStartId() : request.getSlot();
    }

    private Integer effectiveSlotEndId(CreateEmergencyRoomBookingRequest request, Integer slotStartId) {
        return request.getSlotEndId() != null ? request.getSlotEndId() : slotStartId;
    }

    private void validateSearchInput(
            Integer semesterId,
            LocalDate bookingDate,
            Integer slotStartId,
            Integer slotEndId,
            Integer expectedAttendees
    ) {
        if (semesterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "semesterId is required.");
        }
        if (bookingDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bookingDate is required.");
        }
        if (bookingDate.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bookingDate khong duoc la ngay trong qua khu.");
        }
        if (slotStartId == null || slotEndId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "slotStartId and slotEndId are required."
            );
        }
        if (repository.countValidSlotRange(slotStartId, slotEndId) == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "slotEndId must be greater than or equal to slotStartId."
            );
        }
        if (expectedAttendees == null || expectedAttendees <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "expectedAttendees must be greater than 0.");
        }

        int validSemesterDate = repository.countValidSemesterDate(semesterId, bookingDate);
        if (validSemesterDate == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngay su dung khong nam trong hoc ky da chon."
            );
        }
    }

    private void validateCreateInput(
            CreateEmergencyRoomBookingRequest request,
            Integer staffUserId,
            Integer slotStartId,
            Integer slotEndId
    ) {
        validateSearchInput(
                request.getSemesterId(),
                request.getBookingDate(),
                slotStartId,
                slotEndId,
                request.getExpectedAttendees()
        );

        if (request.getTargetType() == null || request.getTargetType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetType is required.");
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
                    "targetType only accepts STUDENT, LECTURER, CLASS, DEPARTMENT, CLUB or OTHER."
            );
        }

        if (request.getRecipientName() == null || request.getRecipientName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "recipientName is required.");
        }
        if (request.getClassroomId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "classroomId is required.");
        }
        if (request.getPurpose() == null || request.getPurpose().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "purpose is required.");
        }
        if (request.getEmergencyReason() == null || request.getEmergencyReason().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "emergencyReason is required.");
        }

        int staffCount = repository.countActiveStaffOrAdminById(staffUserId);
        if (staffCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nguoi dung khong hop le hoac khong phai STAFF/ADMIN dang hoat dong."
            );
        }

        int classroomCount = repository.countUsableClassroom(
                request.getClassroomId(),
                request.getExpectedAttendees()
        );
        if (classroomCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phong khong ton tai, khong hoat dong hoac khong du suc chua."
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

    private String buildPurposeNote(CreateEmergencyRoomBookingRequest request) {
        String recipientCode = request.getRecipientCode();
        if (recipientCode == null || recipientCode.isBlank()) {
            recipientCode = "-";
        }

        return "Doi tuong: " + request.getTargetType().trim().toUpperCase(Locale.ROOT)
                + "\nTen: " + request.getRecipientName().trim()
                + "\nMa so: " + recipientCode
                + "\nMuc dich: " + request.getPurpose().trim();
    }

    private String buildProcessingNote(CreateEmergencyRoomBookingRequest request) {
        return "DAT PHONG KHAN CAP"
                + "\nLy do khan cap: " + request.getEmergencyReason().trim();
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
        response.setSlotStartNo(projection.getSlotStartNo());
        response.setSlotEndNo(projection.getSlotEndNo());
        response.setStartTime(projection.getStartTime());
        response.setEndTime(projection.getEndTime());
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
        response.setSlotStartId(projection.getSlotStartId());
        response.setSlotEndId(projection.getSlotEndId());
        response.setSlotStart(projection.getSlotStart());
        response.setSlotEnd(projection.getSlotEnd());
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
