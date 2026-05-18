package com.ptit.qlphonghoc.lecturer.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.CreateLecturerRoomBorrowRequest;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerAvailableRoomResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerClubLookupResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerRoomBorrowRequestResponse;
import com.ptit.qlphonghoc.lecturer.dto.roomborrow.LecturerSectionLookupResponse;
import com.ptit.qlphonghoc.lecturer.service.LecturerRoomBorrowRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/lecturer/room-borrow-requests")
public class LecturerRoomBorrowRequestController {

    private final LecturerRoomBorrowRequestService service;

    public LecturerRoomBorrowRequestController(LecturerRoomBorrowRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<LecturerRoomBorrowRequestResponse>> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getMyRequests(userDetails.getUserId()));
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<List<LecturerAvailableRoomResponse>> findAvailableRooms(
            @RequestParam Integer semesterId,
            @RequestParam LocalDate bookingDate,
            @RequestParam Integer slot,
            @RequestParam Integer expectedAttendees,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(
                service.findAvailableRooms(
                        semesterId,
                        bookingDate,
                        slot,
                        expectedAttendees,
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
}
