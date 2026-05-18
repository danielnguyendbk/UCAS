package com.ptit.qlphonghoc.lecturer.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.lecturer.dto.roomchange.CreateLecturerRoomChangeRequest;
import com.ptit.qlphonghoc.lecturer.service.LecturerRoomChangeRequestService;
import com.ptit.qlphonghoc.staff.dto.datPhongKhanCap.AvailableRoomResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeResponse;
import com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap.EmergencyRoomChangeScheduleResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lecturer/room-change-requests")
public class LecturerRoomChangeRequestController {

    private final LecturerRoomChangeRequestService service;
    private final JdbcTemplate jdbcTemplate;

    public LecturerRoomChangeRequestController(
            LecturerRoomChangeRequestService service,
            JdbcTemplate jdbcTemplate
    ) {
        this.service = service;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<EmergencyRoomChangeResponse>> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getMyRequests(userDetails.getUserId()));
    }

    @GetMapping("/semesters")
    public ResponseEntity<List<Map<String, Object>>> getSemesters() {
        String sql = """
            SELECT id, semester_name AS name, semester_type AS type, status
            FROM semesters
            WHERE is_deleted = FALSE
            ORDER BY
                CASE status
                    WHEN 'ACTIVE' THEN 0
                    WHEN 'UPCOMING' THEN 1
                    WHEN 'COMPLETED' THEN 2
                    ELSE 3
                END,
                start_date
            """;
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<EmergencyRoomChangeScheduleResponse>> getSchedules(
            @RequestParam Integer semesterId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getSchedules(semesterId, userDetails.getUserId()));
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
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal CustomUserDetails userDetails
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
                        keyword,
                        userDetails.getUserId()
                )
        );
    }

    @PostMapping
    public ResponseEntity<EmergencyRoomChangeResponse> create(
            @Valid @RequestBody CreateLecturerRoomChangeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        EmergencyRoomChangeResponse response = service.create(request, userDetails.getUserId());
        return ResponseEntity
                .created(URI.create("/api/lecturer/room-change-requests/" + response.getId()))
                .body(response);
    }
}
