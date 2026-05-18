package com.ptit.qlphonghoc.student.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.student.dto.roomborrow.CreateStudentRoomBorrowRequest;
import com.ptit.qlphonghoc.student.dto.roomborrow.StudentAvailableRoomResponse;
import com.ptit.qlphonghoc.student.dto.roomborrow.StudentClubLookupResponse;
import com.ptit.qlphonghoc.student.dto.roomborrow.StudentRoomBorrowRequestResponse;
import com.ptit.qlphonghoc.student.service.StudentRoomBorrowRequestService;
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
@RequestMapping("/api/student/room-borrow-requests")
public class StudentRoomBorrowRequestController {

    private final StudentRoomBorrowRequestService service;

    public StudentRoomBorrowRequestController(StudentRoomBorrowRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<StudentRoomBorrowRequestResponse>> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getMyRequests(userDetails.getUserId()));
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<List<StudentAvailableRoomResponse>> findAvailableRooms(
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
    public ResponseEntity<StudentClubLookupResponse> getClub(
            @PathVariable String clubCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getClub(clubCode, userDetails.getUserId()));
    }

    @PostMapping
    public ResponseEntity<StudentRoomBorrowRequestResponse> create(
            @Valid @RequestBody CreateStudentRoomBorrowRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        StudentRoomBorrowRequestResponse response = service.create(request, userDetails.getUserId());

        return ResponseEntity
                .created(URI.create("/api/student/room-borrow-requests/" + response.getId()))
                .body(response);
    }
}
