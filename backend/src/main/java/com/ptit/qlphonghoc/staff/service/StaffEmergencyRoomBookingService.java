package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.CreateEmergencyRoomBookingRequest;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.EmergencyRoomBookingResponse;
import com.ptit.qlphonghoc.staff.repository.StaffEmergencyRoomBookingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;


@Service
public class StaffEmergencyRoomBookingService {

    private static final int TITLE_MAX_LENGTH = 200;
    private static final int NOTE_MAX_LENGTH = 4000;

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
            Integer buildingId,
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
                        buildingId,
                        normalizedRoomType,
                        normalizedKeyword
                )
                .stream()
                .map(this::toAvailableRoomResponse)
                .toList();
    }

    //
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTimetableBlocks(
            Integer semesterId,
            LocalDate weekStart,
            LocalDate weekEnd
    ) {
        if (semesterId == null) {
            throw new BadRequestException("SEMESTER_NOT_FOUND", "semesterId is required.");
        }
        if (weekStart == null || weekEnd == null || weekEnd.isBefore(weekStart)) {
            throw new BadRequestException("INVALID_TIME_RANGE", "weekStart/weekEnd khong hop le.");
        }

        return repository.findTimetableBlocks(semesterId, weekStart, weekEnd);
    }

    @Transactional
    public EmergencyRoomBookingResponse create(CreateEmergencyRoomBookingRequest request, Integer staffUserId) {
        Integer slotStartId = effectiveSlotStartId(request);
        Integer slotEndId = effectiveSlotEndId(request, slotStartId);

        validateCreateInput(request, staffUserId, slotStartId, slotEndId);
        repository.lockClassroomById(request.getClassroomId())
                .orElseThrow(() -> new BadRequestException("ROOM_NOT_FOUND", "classroom khong ton tai."));

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
            throw new BadRequestException(
                    "ROOM_TIME_CONFLICT",
                    "Phong khong kha dung: co the da trung lich, khong du suc chua, dang bao tri hoac khong hoat dong."
            );
        }

        String requestTitle = buildRequestTitle(request);
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
            throw new BadRequestException("SEMESTER_NOT_FOUND", "semesterId is required.");
        }
        if (bookingDate == null) {
            throw new BadRequestException("INVALID_TIME_RANGE", "bookingDate is required.");
        }
        if (bookingDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("PAST_TIME_NOT_ALLOWED", "bookingDate khong duoc la ngay trong qua khu.");
        }
        if (slotStartId == null || slotEndId == null) {
            throw new BadRequestException("INVALID_TIME_RANGE", "slotStartId and slotEndId are required.");
        }
        if (repository.countValidSlotRange(slotStartId, slotEndId) == 0) {
            throw new BadRequestException(
                    "INVALID_TIME_RANGE",
                    "slotEndId must be greater than or equal to slotStartId."
            );
        }
        if (expectedAttendees == null || expectedAttendees <= 0) {
            throw new BadRequestException("VALIDATION_FAILED", "expectedAttendees must be greater than 0.");
        }

        int validSemesterDate = repository.countValidSemesterDate(semesterId, bookingDate);
        if (validSemesterDate == 0) {
            throw new BadRequestException("INVALID_TIME_RANGE", "Ngay su dung khong nam trong hoc ky da chon.");
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
            throw new BadRequestException("VALIDATION_FAILED", "targetType is required.");
        }

        String targetType = request.getTargetType().trim().toUpperCase(Locale.ROOT);
        if (!targetType.equals("STUDENT")
                && !targetType.equals("LECTURER")
                && !targetType.equals("CLASS")
                && !targetType.equals("DEPARTMENT")
                && !targetType.equals("CLUB")
                && !targetType.equals("OTHER")) {
            throw new BadRequestException(
                    "VALIDATION_FAILED",
                    "targetType only accepts STUDENT, LECTURER, CLASS, DEPARTMENT, CLUB or OTHER."
            );
        }

        if (request.getRecipientName() == null || request.getRecipientName().isBlank()) {
            throw new BadRequestException("VALIDATION_FAILED", "recipientName is required.");
        }
        if (request.getClassroomId() == null) {
            throw new BadRequestException("ROOM_NOT_FOUND", "classroomId is required.");
        }
        if (request.getPurpose() == null || request.getPurpose().isBlank()) {
            throw new BadRequestException("VALIDATION_FAILED", "purpose is required.");
        }
        if (request.getEmergencyReason() == null || request.getEmergencyReason().isBlank()) {
            throw new BadRequestException("VALIDATION_FAILED", "emergencyReason is required.");
        }
        if (request.getEmergencyReason().trim().length() < 10) {
            throw new BadRequestException("VALIDATION_FAILED", "emergencyReason phai co it nhat 10 ky tu.");
        }
        if (request.getRecipientName().trim().length() > 120) {
            throw new BadRequestException("VALIDATION_FAILED", "recipientName khong duoc vuot qua 120 ky tu.");
        }
        validateLength(request.getPurpose(), "purpose", NOTE_MAX_LENGTH);
        validateLength(request.getEmergencyReason(), "emergencyReason", NOTE_MAX_LENGTH);

        int staffCount = repository.countActiveStaffOrAdminById(staffUserId);
        if (staffCount == 0) {
            throw new BadRequestException(
                    "FORBIDDEN_OPERATION",
                    "Nguoi dung khong hop le hoac khong phai STAFF/ADMIN dang hoat dong."
            );
        }

        int classroomCount = repository.countUsableClassroom(
                request.getClassroomId(),
                request.getExpectedAttendees()
        );
        if (classroomCount == 0) {
            throw new BadRequestException(
                    "ROOM_INACTIVE_OR_DELETED",
                    "Phong khong ton tai, khong hoat dong hoac khong du suc chua."
            );
        }
    }

    private void validateLength(String value, String fieldName, int maxLength) {
        if (value != null && value.trim().length() > maxLength) {
            throw new BadRequestException(
                    "VALIDATION_FAILED",
                    fieldName + " khong duoc vuot qua " + maxLength + " ky tu."
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
        response.setBuildingId(projection.getBuildingId());
        response.setBuildingCode(projection.getBuildingCode());
        response.setBuildingName(projection.getBuildingName());
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

    private String buildRequestTitle(CreateEmergencyRoomBookingRequest request) {
        String title = "Dat phong khan cap - " + request.getRecipientName().trim();
        return title.length() <= TITLE_MAX_LENGTH ? title : title.substring(0, TITLE_MAX_LENGTH);
    }
}
