package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.staff.dto.allocation.AllocationResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.AllocationValidationSummary;
import com.ptit.qlphonghoc.staff.dto.allocation.ConflictResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ManualAssignRequest;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ScheduleNoteRequest;
import com.ptit.qlphonghoc.staff.repository.StaffAllocationRepository;
import com.ptit.qlphonghoc.staff.service.StaffAllocationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/allocations")
public class StaffAllocationController {

    private final StaffAllocationService service;

    public StaffAllocationController(StaffAllocationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAllocations(
            @RequestParam Integer semesterId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        List<AllocationResponse> list = service.getAllocations(semesterId, search, status);
        if (page != null || size != null) {
            return ResponseEntity.ok(PageResponse.from(list, page, size));
        }
        return ResponseEntity.ok(Map.of("data", list));
    }

    @GetMapping("/conflicts")
    public ResponseEntity<?> getConflicts(
            @RequestParam Integer semesterId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String conflictType
    ) {
        List<ConflictResponse> list = service.getConflicts(semesterId, search, conflictType);
        if (page != null || size != null) {
            return ResponseEntity.ok(PageResponse.from(list, page, size));
        }
        return ResponseEntity.ok(Map.of("data", list));
    }

    @PostMapping("/validate")
    public ResponseEntity<AllocationValidationSummary> validate(@RequestParam Integer semesterId) {
        return ResponseEntity.ok(service.validateAllocations(semesterId));
    }

    @PostMapping("/manual")
    public ResponseEntity<Map<String, String>> manualAssign(@Valid @RequestBody ManualAssignRequest request,
                                                            @AuthenticationPrincipal CustomUserDetails userDetails) {
        service.manualAssign(request, userDetails.getUserId());
        return ResponseEntity.ok(Map.of("message", "Phân phòng thành công!"));
    }

    @PostMapping("/auto-assign")
    public ResponseEntity<Map<String, String>> autoAssign(@RequestParam Integer semesterId,
                                                          @AuthenticationPrincipal CustomUserDetails userDetails) {
        String resultMsg = service.autoAssign(semesterId, userDetails.getUserId());
        return ResponseEntity.ok(Map.of("message", resultMsg));
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<?> getAvailableRooms(
            @RequestParam Integer semesterId,
            @RequestParam String dayOfWeek,
            @RequestParam Integer slot,
            @RequestParam Integer expectedAttendees,
            @RequestParam(required = false, defaultValue = "") String roomType,
            @RequestParam(required = false) Integer scheduleId,
            @RequestParam(required = false) Integer buildingId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        List<StaffAllocationRepository.AllocationRoomProjection> rooms = service.getAvailableRooms(
                semesterId,
                normalizeDayOfWeek(dayOfWeek),
                slot,
                expectedAttendees,
                roomType,
                scheduleId,
                buildingId,
                search
        );
        if (page != null || size != null) {
            return ResponseEntity.ok(PageResponse.from(rooms, page, size));
        }
        return ResponseEntity.ok(rooms);
    }

    @PutMapping("/schedules/{scheduleId}/note")
    public ResponseEntity<Map<String, String>> saveScheduleNote(
            @PathVariable Integer scheduleId,
            @Valid @RequestBody ScheduleNoteRequest request
    ) {
        service.saveScheduleNote(scheduleId, request.note());
        return ResponseEntity.ok(Map.of("message", "Đã lưu ghi chú cho Admin."));
    }

    private String normalizeDayOfWeek(String dayOfWeek) {
        String value = dayOfWeek == null ? "" : dayOfWeek.trim().toUpperCase(Locale.ROOT);

        if (value.contains("MON") || value.contains("2")) {
            return "MON";
        }
        if (value.contains("TUE") || value.contains("3")) {
            return "TUE";
        }
        if (value.contains("WED") || value.contains("4")) {
            return "WED";
        }
        if (value.contains("THU") || value.contains("5")) {
            return "THU";
        }
        if (value.contains("FRI") || value.contains("6")) {
            return "FRI";
        }
        if (value.contains("SAT") || value.contains("7")) {
            return "SAT";
        }
        return "SUN";
    }
}
