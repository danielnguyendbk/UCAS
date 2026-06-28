package com.ptit.qlphonghoc.student.service;

import com.ptit.qlphonghoc.student.dto.roomborrow.CreateStudentRoomBorrowRequest;
import com.ptit.qlphonghoc.student.dto.roomborrow.StudentAvailableRoomResponse;
import com.ptit.qlphonghoc.student.dto.roomborrow.StudentRoomBorrowRequestResponse;
import com.ptit.qlphonghoc.student.entity.Student;
import com.ptit.qlphonghoc.student.repository.StudentRepository;
import com.ptit.qlphonghoc.student.repository.StudentRoomBorrowRequestRepository;
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
public class StudentRoomBorrowRequestService {

    private static final Set<String> REQUEST_TYPES = Set.of(
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

    private final StudentRepository studentRepository;
    private final StudentRoomBorrowRequestRepository repository;

    public StudentRoomBorrowRequestService(
            StudentRepository studentRepository,
            StudentRoomBorrowRequestRepository repository
    ) {
        this.studentRepository = studentRepository;
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<StudentAvailableRoomResponse> findAvailableRooms(
            Integer semesterId,
            LocalDate bookingDate,
            Integer slotStartId,
            Integer slotEndId,
            Integer expectedAttendees,
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
                        normalizeRoomType(roomType),
                        normalizeBlank(keyword)
                )
                .stream()
                .map(this::toAvailableRoomResponse)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<StudentRoomBorrowRequestResponse> getMyRequests(Integer userId) {
        ensureStudentProfile(userId);

        return repository.findBorrowRequestsByUserId(userId)
                .stream()
                .map(this::toBorrowRequestResponse)
                .toList();
    }

    @Transactional
    public StudentRoomBorrowRequestResponse create(
            CreateStudentRoomBorrowRequest request,
            Integer userId
    ) {
        ensureStudentProfile(userId);
        validateCreateInput(request);

        String requestType = normalizeRequestType(request.getRequestType());
        String bookingScope = "PERSONAL";

        Integer preferredClassroomId = request.getPreferredClassroomId();
        if (preferredClassroomId != null) {
            int classroomCount = repository.countUsableClassroom(
                    preferredClassroomId,
                    request.getExpectedAttendees()
            );
            if (classroomCount == 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Preferred classroom is inactive or does not have enough capacity."
                );
            }
        }

        String title = buildRequestTitle(requestType, request.getPurposeNote());

        repository.insertBorrowRequest(
                title,
                requestType,
                bookingScope,
                request.getSemesterId(),
                request.getBookingDate(),
                request.getSlotStartId(),
                request.getSlotEndId(),
                userId,
                request.getExpectedAttendees(),
                preferredClassroomId,
                normalizeRoomType(request.getRequestedRoomType()),
                request.getPurposeNote().trim()
        );

        Integer id = repository.getLastInsertId();

        return repository.findBorrowRequestById(id)
                .map(this::toBorrowRequestResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Unable to create room borrow request."
                ));
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
        if (slotStartId == null || slotEndId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slotStartId and slotEndId are required.");
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
                    "Booking date must be inside the selected semester."
            );
        }
    }

    private void validateCreateInput(CreateStudentRoomBorrowRequest request) {
        validateSearchInput(
                request.getSemesterId(),
                request.getBookingDate(),
                request.getSlotStartId(),
                request.getSlotEndId(),
                request.getExpectedAttendees()
        );

        normalizeRequestType(request.getRequestType());
        normalizeRoomType(request.getRequestedRoomType());

        if (request.getPurposeNote() == null || request.getPurposeNote().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "purposeNote is required.");
        }
    }

    private Student ensureStudentProfile(Integer userId) {
        return studentRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Student profile not found."
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
                    "requestType must be one of MEETING, CLUB_ACTIVITY, EVENT, OTHER."
            );
        }
        return value;
    }

    private String normalizeRoomType(String roomType) {
        if (roomType == null || roomType.isBlank()) {
            return null;
        }

        String value = roomType.trim().toUpperCase(Locale.ROOT);
        if (!ROOM_TYPES.contains(value)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "requestedRoomType must be LECTURE, LAB, SEMINAR or AUDITORIUM."
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
        return "Yeu cau muon phong - " + purpose;
    }

    private StudentAvailableRoomResponse toAvailableRoomResponse(
            StudentRoomBorrowRequestRepository.AvailableRoomProjection projection
    ) {
        StudentAvailableRoomResponse response = new StudentAvailableRoomResponse();
        response.setClassroomId(projection.getClassroomId());
        response.setRoomCode(projection.getRoomCode());
        response.setCapacity(projection.getCapacity());
        response.setRoomType(projection.getRoomType());
        response.setRoomTypeText(projection.getRoomTypeText());
        response.setMainEquipment(projection.getMainEquipment());
        response.setStatusText(projection.getStatusText());
        return response;
    }




    private StudentRoomBorrowRequestResponse toBorrowRequestResponse(
            StudentRoomBorrowRequestRepository.BorrowRequestProjection projection
    ) {
        StudentRoomBorrowRequestResponse response = new StudentRoomBorrowRequestResponse();
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
        response.setExpectedAttendees(projection.getExpectedAttendees());
        response.setPreferredClassroomId(projection.getPreferredClassroomId());
        response.setPreferredRoomCode(projection.getPreferredRoomCode());
        response.setApprovedClassroomId(projection.getApprovedClassroomId());
        response.setApprovedRoomCode(projection.getApprovedRoomCode());
        response.setRequestedRoomType(projection.getRequestedRoomType());
        response.setPurposeNote(projection.getPurposeNote());
        response.setStatus(projection.getStatus());
        response.setProcessingNote(projection.getProcessingNote());
        response.setRejectReason(projection.getRejectReason());
        response.setApprovedAt(projection.getApprovedAt());
        response.setCreatedAt(projection.getCreatedAt());
        return response;
    }
}
