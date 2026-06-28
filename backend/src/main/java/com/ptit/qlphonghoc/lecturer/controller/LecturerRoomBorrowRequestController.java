package com.ptit.qlphonghoc.lecturer.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.CreateLecturerRoomBorrowRequest;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerAvailableRoomResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerClubLookupResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerRoomBorrowRequestResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerSectionLookupResponse;
import com.ptit.qlphonghoc.lecturer.service.LecturerRoomBorrowRequestService;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/lecturer/room-borrow-requests")
public class LecturerRoomBorrowRequestController {

    private final LecturerRoomBorrowRequestService service;

    public LecturerRoomBorrowRequestController(LecturerRoomBorrowRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "false") boolean includeCancelled
    ) {
        List<LecturerRoomBorrowRequestResponse> list = service.getMyRequests(userDetails.getUserId())
                .stream()
                .filter(request -> status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)
                        || status.equalsIgnoreCase(request.getStatus()))
                .filter(request -> includeCancelled
                        || "CANCELLED".equalsIgnoreCase(status)
                        || !"CANCELLED".equalsIgnoreCase(request.getStatus()))
                .filter(request -> matchesSearch(request, search))
                .toList();
        if (page != null || size != null) {
            return ResponseEntity.ok(PageResponse.from(list, page, size));
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<List<LecturerAvailableRoomResponse>> findAvailableRooms(
            @RequestParam Integer semesterId,
            @RequestParam LocalDate bookingDate,
            @RequestParam(required = false) Integer slotStartId,
            @RequestParam(required = false) Integer slotEndId,
            @RequestParam(required = false) Integer slot,
            @RequestParam Integer expectedAttendees,
            @RequestParam(required = false) Integer buildingId,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String keyword
    ) {
        Integer effectiveSlotStartId = slotStartId != null ? slotStartId : slot;
        Integer effectiveSlotEndId = slotEndId != null ? slotEndId : effectiveSlotStartId;

        return ResponseEntity.ok(
                service.findAvailableRooms(
                        semesterId,
                        bookingDate,
                        effectiveSlotStartId,
                        effectiveSlotEndId,
                        expectedAttendees,
                        buildingId,
                        roomType,
                        keyword
                )
        );
    }

    @GetMapping("/clubs/{clubCode}")
    public ResponseEntity<LecturerClubLookupResponse> getClub(
            @PathVariable String clubCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getClub(clubCode, userDetails.getUserId()));
    }

    @GetMapping("/sections/lookup")
    public ResponseEntity<LecturerSectionLookupResponse> getSection(
            @RequestParam Integer semesterId,
            @RequestParam String sectionCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getSection(semesterId, sectionCode, userDetails.getUserId()));
    }

    @PostMapping
    public ResponseEntity<LecturerRoomBorrowRequestResponse> create(
            @Valid @RequestBody CreateLecturerRoomBorrowRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        LecturerRoomBorrowRequestResponse response = service.create(request, userDetails.getUserId());

        return ResponseEntity
                .created(URI.create("/api/lecturer/room-borrow-requests/" + response.getId()))
                .body(response);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<LecturerRoomBorrowRequestResponse> cancel(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.cancel(id, userDetails.getUserId()));
    }

    private boolean matchesSearch(LecturerRoomBorrowRequestResponse request, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String keyword = search.trim().toLowerCase(Locale.ROOT);
        return contains(request.getId(), keyword)
                || contains(request.getRequestTitle(), keyword)
                || contains(request.getSectionCode(), keyword)
                || contains(request.getCourseName(), keyword)
                || contains(request.getPreferredRoomCode(), keyword)
                || contains(request.getApprovedRoomCode(), keyword)
                || contains(request.getStatus(), keyword);
    }

    private boolean contains(Object value, String keyword) {
        return value != null && String.valueOf(value).toLowerCase(Locale.ROOT).contains(keyword);
    }
}
