package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.staff.dto.roomborrow.RejectRoomBorrowRequest;
import com.ptit.qlphonghoc.staff.dto.roomborrow.StaffRoomBorrowRequestResponse;
import com.ptit.qlphonghoc.staff.service.StaffRoomBorrowRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/room-borrow-requests")
public class StaffRoomBorrowRequestController {

    private final StaffRoomBorrowRequestService service;

    public StaffRoomBorrowRequestController(StaffRoomBorrowRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<StaffRoomBorrowRequestResponse>> getRequests(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(service.getRequests(status));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<StaffRoomBorrowRequestResponse> approve(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.approve(id, userDetails.getUserId()));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<StaffRoomBorrowRequestResponse> reject(
            @PathVariable Integer id,
            @Valid @RequestBody RejectRoomBorrowRequest request
    ) {
        return ResponseEntity.ok(service.reject(id, request.getRejectReason()));
    }
}
