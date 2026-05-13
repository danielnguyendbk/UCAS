package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.CreateEmergencyRoomBookingRequest;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.EmergencyRoomBookingResponse;
import com.ptit.qlphonghoc.staff.service.StaffEmergencyRoomBookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

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

    @PostMapping
    public ResponseEntity<EmergencyRoomBookingResponse> create(
            @Valid @RequestBody CreateEmergencyRoomBookingRequest request
    ) {
        EmergencyRoomBookingResponse response = service.create(request);

        return ResponseEntity
                .created(URI.create("/api/staff/emergency-room-bookings/" + response.getId()))
                .body(response);
    }
}