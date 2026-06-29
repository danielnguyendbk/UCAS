package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.CreateEmergencyRoomBookingRequest;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.EmergencyRoomBookingResponse;
import com.ptit.qlphonghoc.staff.service.StaffEmergencyRoomBookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;



import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/staff/emergency-room-bookings")
public class StaffEmergencyRoomBookingController {

    private final StaffEmergencyRoomBookingService service;

    public StaffEmergencyRoomBookingController(StaffEmergencyRoomBookingService service) {
        this.service = service;
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<List<AvailableRoomResponse>> findAvailableRooms(
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

    @PostMapping
    public ResponseEntity<EmergencyRoomBookingResponse> create(
            @Valid @RequestBody CreateEmergencyRoomBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        EmergencyRoomBookingResponse response = service.create(request, userDetails.getUserId());

        return ResponseEntity
                .created(URI.create("/api/staff/emergency-room-bookings/" + response.getId()))
                .body(response);
    }

    @GetMapping("/timetable-blocks")
    public ResponseEntity<List<Map<String, Object>>> getTimetableBlocks(
            @RequestParam Integer semesterId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekEnd
    ) {
        return ResponseEntity.ok(service.getTimetableBlocks(semesterId, weekStart, weekEnd));
    }
}
