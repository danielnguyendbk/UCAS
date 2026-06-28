package com.ptit.qlphonghoc.lecturer.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.CreateLecturerRoomBorrowRequest;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerAvailableRoomResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerClubLookupResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerRoomBorrowRequestResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerSectionLookupResponse;
import com.ptit.qlphonghoc.lecturer.entity.Lecturer;
import com.ptit.qlphonghoc.lecturer.repository.LecturerRepository;
import com.ptit.qlphonghoc.lecturer.repository.LecturerRoomBorrowRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class LecturerRoomBorrowRequestService {

    private static final Set<String> REQUEST_TYPES = Set.of(
            "MAKEUP_CLASS",
            "SEMINAR",
            "WORKSHOP",
            "MEETING",
            "CLUB_ACTIVITY",
            "EVENT",
            "OTHER"
    );

    private static final Set<String> ROOM_TYPES = Set.of(
            "LECTURE",
            "LAB",
            "SEMINAR",
            "AUDITORIUM"
    );

    private final LecturerRepository lecturerRepository;
    private final LecturerRoomBorrowRequestRepository repository;

    public LecturerRoomBorrowRequestService(
            LecturerRepository lecturerRepository,
            LecturerRoomBorrowRequestRepository repository
    ) {
        this.lecturerRepository = lecturerRepository;
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<LecturerAvailableRoomResponse> findAvailableRooms(
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

        return repository.findAvailableRooms(
                        semesterId,
                        bookingDate,
                        toDayCode(bookingDate),
                        slotStartId,
                        slotEndId,
                        expectedAttendees,
                        buildingId,
                        normalizeRoomType(roomType),
                        normalizeBlank(keyword)
                )
                .stream()
                .map(this::toAvailableRoomResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LecturerClubLookupResponse getClub(String clubCode, Integer userId) {
        ensureLecturerProfile(userId);

        return repository.findClubLookupByCode(normalizeClubCode(clubCode), userId)
                .map(this::toClubLookupResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Club not found or inactive."
                ));
    }

    @Transactional(readOnly = true)
    public LecturerSectionLookupResponse getSection(
            Integer semesterId,
            String sectionCode,
            Integer userId
    ) {
        Lecturer lecturer = ensureLecturerProfile(userId);
        if (semesterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "semesterId is required.");
        }

        return repository.findSectionByCode(
                        semesterId,
                        lecturer.getId(),
                        normalizeSectionCode(sectionCode)
                )
                .map(this::toSectionLookupResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Class section not found for this lecturer and semester."
                ));
    }

    @Transactional(readOnly = true)
    public List<LecturerRoomBorrowRequestResponse> getMyRequests(Integer userId) {
        ensureLecturerProfile(userId);

        return repository.findBorrowRequestsByUserId(userId)
                .stream()
                .map(this::toBorrowRequestResponse)
                .toList();
    }

    @Transactional
    public LecturerRoomBorrowRequestResponse create(
            CreateLecturerRoomBorrowRequest request,
            Integer userId
    ) {
        Lecturer lecturer = ensureLecturerProfile(userId);
        validateCreateInput(request);

        String requestType = normalizeRequestType(request.getRequestType());
        String bookingScope = "CLUB_ACTIVITY".equals(requestType) ? "CLUB" : "PERSONAL";
        Integer clubId = resolveClubId(bookingScope, request.getClubCode(), userId);
        Integer sectionId = resolveSectionId(requestType, request.getSectionId(), request, lecturer.getId());

        int classroomCount = repository.countUsableClassroom(
                request.getPreferredClassroomId(),
                request.getExpectedAttendees(),
                null,
                null
        );
        if (classroomCount == 0) {
            throw new BadRequestException(
                    "CLASSROOM_NOT_FOUND",
                    "Preferred classroom is inactive or does not have enough capacity."
            );
        }

        int availableCount = repository.countAvailableClassroom(
                request.getSemesterId(),
                request.getBookingDate(),
                toDayCode(request.getBookingDate()),
                request.getSlotStartId(),
                request.getSlotEndId(),
                request.getPreferredClassroomId(),
                request.getExpectedAttendees()
        );
        if (availableCount == 0) {
            throw new BadRequestException(
                    "ROOM_TIME_CONFLICT",
                    "Phong da co lich trong khung thoi gian da chon."
            );
        }

        int duplicateCount = repository.countDuplicatePendingBorrowRequest(
                userId,
                request.getSemesterId(),
                request.getBookingDate(),
                request.getSlotStartId(),
                request.getSlotEndId(),
                request.getPreferredClassroomId(),
                sectionId
        );
        if (duplicateCount > 0) {
            throw new BadRequestException(
                    "REQUEST_DUPLICATED",
                    "Ban da co yeu cau dang cho cho cung lich/phong/thoi gian."
            );
        }

        repository.insertBorrowRequest(
                buildRequestTitle(requestType, request.getPurposeNote()),
                requestType,
                bookingScope,
                request.getSemesterId(),
                sectionId,
                request.getBookingDate(),
                request.getSlotStartId(),
                request.getSlotEndId(),
                userId,
                clubId,
                request.getExpectedAttendees(),
                request.getPreferredClassroomId(),
                request.getPurposeNote().trim()
        );

        Integer id = repository.getLastInsertId();

        return repository.findBorrowRequestById(id)
                .map(this::toBorrowRequestResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Unable to create lecturer room borrow request."
                ));
    }

    @Transactional
    public LecturerRoomBorrowRequestResponse cancel(Integer id, Integer userId) {
        ensureLecturerProfile(userId);
        LecturerRoomBorrowRequestRepository.BorrowRequestProjection current = repository.findBorrowRequestById(id)
                .filter(request -> userId.equals(request.getRequestedBy()))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "REQUEST_NOT_FOUND",
                        "Khong tim thay yeu cau dat phong."
                ));
        if (!"PENDING".equalsIgnoreCase(current.getStatus())) {
            throw new BadRequestException(
                    "REQUEST_NOT_CANCELLABLE",
                    "Chi co the huy yeu cau dang cho duyet."
            );
        }
        int updated = repository.cancelPendingBorrowRequest(id, userId);
        if (updated == 0) {
            throw new BadRequestException("REQUEST_NOT_CANCELLABLE", "Huy yeu cau that bai.");
        }
        return repository.findBorrowRequestById(id)
                .map(this::toBorrowRequestResponse)
                .orElseThrow(() -> new ResourceNotFoundException("REQUEST_NOT_FOUND", "Khong tim thay yeu cau dat phong."));
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
            throw new BadRequestException("INVALID_TIME_RANGE", "Khong the tao yeu cau cho ngay trong qua khu.");
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
            throw new BadRequestException(
                    "SEMESTER_NOT_FOUND",
                    "Booking date must be inside the selected semester."
            );
        }
    }

    private void validateCreateInput(CreateLecturerRoomBorrowRequest request) {
        validateSearchInput(
                request.getSemesterId(),
                request.getBookingDate(),
                request.getSlotStartId(),
                request.getSlotEndId(),
                request.getExpectedAttendees()
        );

        normalizeRequestType(request.getRequestType());

        if (request.getPreferredClassroomId() == null) {
            throw new BadRequestException("CLASSROOM_NOT_FOUND", "preferredClassroomId is required.");
        }
        if (request.getPurposeNote() == null || request.getPurposeNote().isBlank()) {
            throw new BadRequestException("VALIDATION_FAILED", "purposeNote is required.");
        }
        if (request.getPurposeNote().trim().length() < 10 || request.getPurposeNote().trim().length() > 500) {
            throw new BadRequestException("VALIDATION_FAILED", "purposeNote phai tu 10 den 500 ky tu.");
        }
    }

    private Lecturer ensureLecturerProfile(Integer userId) {
        return lecturerRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Lecturer profile not found."
                ));
    }

    private String normalizeRequestType(String requestType) {
        if (requestType == null || requestType.isBlank()) {
            throw new BadRequestException("VALIDATION_FAILED", "requestType is required.");
        }

        String value = requestType.trim().toUpperCase(Locale.ROOT);
        if (!REQUEST_TYPES.contains(value)) {
            throw new BadRequestException(
                    "VALIDATION_FAILED",
                    "requestType must be one of MAKEUP_CLASS, SEMINAR, WORKSHOP, MEETING, CLUB_ACTIVITY, EVENT, OTHER."
            );
        }
        return value;
    }

    private Integer resolveClubId(String bookingScope, String clubCode, Integer userId) {
        if (!"CLUB".equals(bookingScope)) {
            return null;
        }

        LecturerRoomBorrowRequestRepository.ClubLookupProjection club = repository
                .findClubLookupByCode(normalizeClubCode(clubCode), userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Club not found or inactive."
                ));

        if (!isAdvisor(club)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only the club advisor can create a club room borrow request."
            );
        }

        return club.getClubId();
    }

    private Integer resolveSectionId(
            String requestType,
            Integer sectionId,
            CreateLecturerRoomBorrowRequest request,
            Integer lecturerId
    ) {
        if (!"MAKEUP_CLASS".equals(requestType)) {
            return null;
        }

        if (sectionId == null) {
            throw new BadRequestException(
                    "SECTION_NOT_FOUND",
                    "sectionId is required for makeup class requests."
            );
        }

        int sectionCount = repository.countValidLecturerSection(
                sectionId,
                request.getSemesterId(),
                lecturerId
        );
        if (sectionCount == 0) {
            throw new BadRequestException(
                    "SECTION_NOT_FOUND",
                    "Class section does not belong to this lecturer and semester."
            );
        }

        return sectionId;
    }

    private String normalizeClubCode(String clubCode) {
        if (clubCode == null || clubCode.isBlank()) {
            throw new BadRequestException(
                    "VALIDATION_FAILED",
                    "clubCode is required for club activity requests."
            );
        }

        return clubCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeSectionCode(String sectionCode) {
        if (sectionCode == null || sectionCode.isBlank()) {
            throw new BadRequestException(
                    "SECTION_NOT_FOUND",
                    "sectionCode is required."
            );
        }

        return sectionCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRoomType(String roomType) {
        if (roomType == null || roomType.isBlank()) {
            return null;
        }

        String value = roomType.trim().toUpperCase(Locale.ROOT);
        if (!ROOM_TYPES.contains(value)) {
            throw new BadRequestException(
                    "VALIDATION_FAILED",
                    "roomType must be LECTURE, LAB, SEMINAR or AUDITORIUM."
            );
        }
        return value;
    }

    private String normalizeBlank(String value) {
        return value == null ? "" : value.trim();
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

    private String buildRequestTitle(String requestType, String purposeNote) {
        String purpose = purposeNote == null ? "" : purposeNote.trim();
        if (purpose.length() > 120) {
            purpose = purpose.substring(0, 120);
        }
        if (purpose.isBlank()) {
            purpose = requestType;
        }
        return "Yeu cau muon phong GV - " + purpose;
    }

    private LecturerAvailableRoomResponse toAvailableRoomResponse(
            LecturerRoomBorrowRequestRepository.AvailableRoomProjection projection
    ) {
        LecturerAvailableRoomResponse response = new LecturerAvailableRoomResponse();
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
        return response;
    }

    private LecturerClubLookupResponse toClubLookupResponse(
            LecturerRoomBorrowRequestRepository.ClubLookupProjection projection
    ) {
        LecturerClubLookupResponse response = new LecturerClubLookupResponse();
        response.setClubId(projection.getClubId());
        response.setClubCode(projection.getClubCode());
        response.setClubName(projection.getClubName());
        response.setAdvisor(isAdvisor(projection));
        return response;
    }

    private boolean isAdvisor(
            LecturerRoomBorrowRequestRepository.ClubLookupProjection projection
    ) {
        Number advisor = projection.getAdvisor();
        return advisor != null && advisor.intValue() == 1;
    }

    private LecturerSectionLookupResponse toSectionLookupResponse(
            LecturerRoomBorrowRequestRepository.SectionLookupProjection projection
    ) {
        LecturerSectionLookupResponse response = new LecturerSectionLookupResponse();
        response.setSectionId(projection.getSectionId());
        response.setSectionCode(projection.getSectionCode());
        response.setCourseName(projection.getCourseName());
        response.setMaxCapacity(projection.getMaxCapacity());
        response.setEnrolledCount(projection.getEnrolledCount());
        response.setRequiredRoomType(projection.getRequiredRoomType());
        return response;
    }

    private LecturerRoomBorrowRequestResponse toBorrowRequestResponse(
            LecturerRoomBorrowRequestRepository.BorrowRequestProjection projection
    ) {
        LecturerRoomBorrowRequestResponse response = new LecturerRoomBorrowRequestResponse();
        response.setId(projection.getId());
        response.setRequestTitle(projection.getRequestTitle());
        response.setRequestType(projection.getRequestType());
        response.setBookingScope(projection.getBookingScope());
        response.setSemesterId(projection.getSemesterId());
        response.setBookingDate(projection.getBookingDate());
        response.setSlot(projection.getSlot());
        response.setSlotStartId(projection.getSlotStartId());
        response.setSlotEndId(projection.getSlotEndId());
        response.setSlotStart(projection.getSlotStart());
        response.setSlotEnd(projection.getSlotEnd());
        response.setPeriodText(projection.getPeriodText());
        response.setRequestedBy(projection.getRequestedBy());
        response.setClubId(projection.getClubId());
        response.setClubName(projection.getClubName());
        response.setSectionId(projection.getSectionId());
        response.setSectionCode(projection.getSectionCode());
        response.setCourseName(projection.getCourseName());
        response.setSectionMaxCapacity(projection.getSectionMaxCapacity());
        response.setExpectedAttendees(projection.getExpectedAttendees());
        response.setPreferredClassroomId(projection.getPreferredClassroomId());
        response.setPreferredRoomCode(projection.getPreferredRoomCode());
        response.setApprovedClassroomId(projection.getApprovedClassroomId());
        response.setApprovedRoomCode(projection.getApprovedRoomCode());
        response.setPurposeNote(projection.getPurposeNote());
        response.setStatus(projection.getStatus());
        response.setProcessingNote(projection.getProcessingNote());
        response.setRejectReason(projection.getRejectReason());
        response.setApprovedAt(projection.getApprovedAt());
        response.setCreatedAt(projection.getCreatedAt());
        return response;
    }
}
