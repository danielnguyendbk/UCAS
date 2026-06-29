package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.CreateEmergencyRoomChangeRequest;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeScheduleResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.RejectEmergencyRoomChangeRequest;
import com.ptit.qlphonghoc.staff.service.StaffEmergencyRoomChangeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/staff/emergency-room-changes")
public class StaffEmergencyRoomChangeController {

    private final StaffEmergencyRoomChangeService service;

    public StaffEmergencyRoomChangeController(StaffEmergencyRoomChangeService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getChangeRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "false") boolean includeCancelled
    ) {
        List<EmergencyRoomChangeResponse> list = service.getChangeRequests(status)
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

    @GetMapping("/schedules")
    public ResponseEntity<List<EmergencyRoomChangeScheduleResponse>> getSchedules(
            @RequestParam Integer semesterId
    ) {
        return ResponseEntity.ok(service.getSchedules(semesterId));
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<List<AvailableRoomResponse>> findAvailableRooms(
            @RequestParam Integer semesterId,
            @RequestParam Integer scheduleId,
            @RequestParam String scope,
            @RequestParam(required = false) LocalDate targetDate,
            @RequestParam(required = false) Integer fromWeek,
            @RequestParam(required = false) Integer toWeek,
            @RequestParam(required = false) Integer expectedAttendees,
            @RequestParam(required = false) Integer buildingId,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(
                service.findAvailableRooms(
                        semesterId,
                        scheduleId,
                        scope,
                        targetDate,
                        fromWeek,
                        toWeek,
                        expectedAttendees,
                        buildingId,
                        roomType,
                        keyword
                )
        );
    }

    @PostMapping
    public ResponseEntity<EmergencyRoomChangeResponse> create(
            @Valid @RequestBody CreateEmergencyRoomChangeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        EmergencyRoomChangeResponse response = service.create(request, userDetails.getUserId());
        return ResponseEntity
                .created(URI.create("/api/staff/emergency-room-changes/" + response.getId()))
                .body(response);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<EmergencyRoomChangeResponse> approve(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.approve(id, userDetails.getUserId()));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<EmergencyRoomChangeResponse> reject(
            @PathVariable Integer id,
            @Valid @RequestBody RejectEmergencyRoomChangeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.reject(id, userDetails.getUserId(), request.getRejectReason()));
    }

    private boolean matchesSearch(EmergencyRoomChangeResponse request, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String keyword = search.trim().toLowerCase(Locale.ROOT);
        return contains(request.getId(), keyword)
                || contains(request.getRequesterName(), keyword)
                || contains(request.getRequesterUsername(), keyword)
                || contains(request.getClassCode(), keyword)
                || contains(request.getCourseName(), keyword)
                || contains(request.getOldRoomCode(), keyword)
                || contains(request.getRequestedRoomCode(), keyword)
                || contains(request.getNewRoomCode(), keyword)
                || contains(request.getStatus(), keyword);
    }

    private boolean contains(Object value, String keyword) {
        return value != null && String.valueOf(value).toLowerCase(Locale.ROOT).contains(keyword);
    }
}
