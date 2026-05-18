package com.ptit.qlphonghoc.lecturer.service;

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
            Integer slot,
            Integer expectedAttendees,
            String roomType,
            String keyword
    ) {
        validateSearchInput(semesterId, bookingDate, slot, expectedAttendees);

        Integer timeSlotId = repository.findTimeSlotIdBySlotNumber(slot)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "slot does not exist: " + slot
                ));

        return repository.findAvailableRooms(
                        semesterId,
                        bookingDate,
                        toDayCode(bookingDate),
                        timeSlotId,
                        expectedAttendees,
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
        Integer timeSlotId = repository.findTimeSlotIdBySlotNumber(request.getSlot())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "slot does not exist: " + request.getSlot()
                ));

        int classroomCount = repository.countUsableClassroom(
                request.getPreferredClassroomId(),
                request.getExpectedAttendees()
        );
        if (classroomCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Preferred classroom is inactive or does not have enough capacity."
            );
        }

        repository.insertBorrowRequest(
                buildRequestTitle(requestType, request.getPurposeNote()),
                requestType,
                bookingScope,
                request.getSemesterId(),
                sectionId,
                request.getBookingDate(),
                timeSlotId,
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

    private void validateSearchInput(
            Integer semesterId,
            LocalDate bookingDate,
            Integer slot,
            Integer expectedAttendees
    ) {
        if (semesterId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "semesterId is required.");
        }
        if (bookingDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bookingDate is required.");
        }
        if (slot == null || slot < 1 || slot > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slot must be from 1 to 5.");
        }
        if (expectedAttendees == null || expectedAttendees <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "expectedAttendees must be greater than 0.");
        }

        int validSemesterDate = repository.countValidSemesterDate(semesterId, bookingDate);
        if (validSemesterDate == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Booking date must be inside the selected semester."
            );
        }
    }

    private void validateCreateInput(CreateLecturerRoomBorrowRequest request) {
        validateSearchInput(
                request.getSemesterId(),
                request.getBookingDate(),
                request.getSlot(),
                request.getExpectedAttendees()
        );

        normalizeRequestType(request.getRequestType());

        if (request.getPreferredClassroomId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "preferredClassroomId is required.");
        }
        if (request.getPurposeNote() == null || request.getPurposeNote().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "purposeNote is required.");
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "requestType is required.");
        }

        String value = requestType.trim().toUpperCase(Locale.ROOT);
        if (!REQUEST_TYPES.contains(value)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
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
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "sectionId is required for makeup class requests."
            );
        }

        int sectionCount = repository.countValidLecturerSection(
                sectionId,
                request.getSemesterId(),
                lecturerId
        );
        if (sectionCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Class section does not belong to this lecturer and semester."
            );
        }

        return sectionId;
    }

    private String normalizeClubCode(String clubCode) {
        if (clubCode == null || clubCode.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "clubCode is required for club activity requests."
            );
        }

        return clubCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeSectionCode(String sectionCode) {
        if (sectionCode == null || sectionCode.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
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
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
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
