package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.CreateEmergencyRoomChangeRequest;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeScheduleResponse;
import com.ptit.qlphonghoc.staff.service.StaffEmergencyRoomChangeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff/emergency-room-changes")
public class StaffEmergencyRoomChangeController {

    private final StaffEmergencyRoomChangeService service;

    public StaffEmergencyRoomChangeController(StaffEmergencyRoomChangeService service) {
        this.service = service;
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
                        roomType,
                        keyword
                )
        );
    }

    @PostMapping
    public ResponseEntity<EmergencyRoomChangeResponse> create(
            @Valid @RequestBody CreateEmergencyRoomChangeRequest request
    ) {
        EmergencyRoomChangeResponse response = service.create(request);
        return ResponseEntity
                .created(URI.create("/api/staff/emergency-room-changes/" + response.getId()))
                .body(response);
    }
}
