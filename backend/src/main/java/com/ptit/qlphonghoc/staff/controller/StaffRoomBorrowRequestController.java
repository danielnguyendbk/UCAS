package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
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
import java.util.Locale;

@RestController
@RequestMapping("/api/staff/room-borrow-requests")
public class StaffRoomBorrowRequestController {

    private final StaffRoomBorrowRequestService service;

    public StaffRoomBorrowRequestController(StaffRoomBorrowRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "false") boolean includeCancelled
    ) {
        List<StaffRoomBorrowRequestResponse> list = service.getRequests(status)
                .stream()
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

    private boolean matchesSearch(StaffRoomBorrowRequestResponse request, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String keyword = search.trim().toLowerCase(Locale.ROOT);
        return contains(request.getId(), keyword)
                || contains(request.getRequestTitle(), keyword)
                || contains(request.getRequesterName(), keyword)
                || contains(request.getRequesterUsername(), keyword)
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
