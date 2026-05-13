package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.staff.dto.CreateTimetableSessionRequest;
import com.ptit.qlphonghoc.staff.dto.TimetableRoomGridResponse;
import com.ptit.qlphonghoc.staff.dto.TimetableSessionResponse;
import com.ptit.qlphonghoc.staff.dto.UpdateTimetableSessionRequest;
import com.ptit.qlphonghoc.staff.service.StaffTimetableService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/staff/timetable")
public class StaffTimetableController {

    private final StaffTimetableService staffTimetableService;

    public StaffTimetableController(StaffTimetableService staffTimetableService) {
        this.staffTimetableService = staffTimetableService;
    }

    @GetMapping
    public ResponseEntity<List<TimetableSessionResponse>> getTimetable(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) Integer sectionId,
            @RequestParam(required = false) Integer classroomId,
            @RequestParam(required = false) String day
    ) {
        return ResponseEntity.ok(
                staffTimetableService.getTimetable(
                        semesterId,
                        sectionId,
                        classroomId,
                        day
                )
        );
    }

    @GetMapping("/grid")
    public ResponseEntity<List<TimetableRoomGridResponse>> getTimetableGrid(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) Integer classroomId
    ) {
        return ResponseEntity.ok(
                staffTimetableService.getTimetableGrid(semesterId, classroomId)
        );
    }

    @GetMapping("/{scheduleId}")
    public ResponseEntity<TimetableSessionResponse> getByScheduleId(
            @PathVariable Integer scheduleId
    ) {
        return ResponseEntity.ok(staffTimetableService.getByScheduleId(scheduleId));
    }

    @PostMapping
    public ResponseEntity<TimetableSessionResponse> create(
            @Valid @RequestBody CreateTimetableSessionRequest request
    ) {
        TimetableSessionResponse response = staffTimetableService.create(request);

        return ResponseEntity
                .created(URI.create("/api/staff/timetable/" + response.getScheduleId()))
                .body(response);
    }

    @PutMapping("/{scheduleId}")
    public ResponseEntity<TimetableSessionResponse> update(
            @PathVariable Integer scheduleId,
            @Valid @RequestBody UpdateTimetableSessionRequest request
    ) {
        return ResponseEntity.ok(staffTimetableService.update(scheduleId, request));
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> delete(@PathVariable Integer scheduleId) {
        staffTimetableService.delete(scheduleId);
        return ResponseEntity.noContent().build();
    }
}