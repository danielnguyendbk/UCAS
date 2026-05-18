package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.staff.dto.allocation.AllocationResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ConflictResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ManualAssignRequest;
import com.ptit.qlphonghoc.staff.service.StaffAllocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<Map<String, Object>> getAllocations(@RequestParam Integer semesterId) {
        List<AllocationResponse> list = service.getAllocations(semesterId);
        return ResponseEntity.ok(Map.of("data", list));
    }

    @GetMapping("/conflicts")
    public ResponseEntity<Map<String, Object>> getConflicts(@RequestParam Integer semesterId) {
        List<ConflictResponse> list = service.getConflicts(semesterId);
        return ResponseEntity.ok(Map.of("data", list));
    }

    @PostMapping("/manual")
    public ResponseEntity<Map<String, String>> manualAssign(@RequestBody ManualAssignRequest request,
                                                            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            service.manualAssign(request, userDetails.getUserId());
            return ResponseEntity.ok(Map.of("message", "Phân phòng thành công!"));
        } catch (Exception e) {
            Throwable rootCause = e;
            while (rootCause.getCause() != null) {
                rootCause = rootCause.getCause();
            }

            return ResponseEntity.status(400).body(Map.of("message", rootCause.getMessage()));
        }
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
            @RequestParam(required = false, defaultValue = "") String roomType
    ) {
        return ResponseEntity.ok(service.getAvailableRooms(
                semesterId,
                normalizeDayOfWeek(dayOfWeek),
                slot,
                expectedAttendees,
                roomType
        ));
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
