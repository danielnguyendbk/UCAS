package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.staff.dto.allocation.AllocationResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ConflictResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ManualAssignRequest;
import com.ptit.qlphonghoc.staff.service.StaffAllocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public ResponseEntity<Map<String, String>> manualAssign(@RequestBody ManualAssignRequest request) {
        try {
            // Tạm thời hardcode staffUserId = 2
            service.manualAssign(request, 2);
            return ResponseEntity.ok(Map.of("message", "Phân phòng thành công!"));
        } catch (Exception e) {
            // Bóc tách Exception qua nhiều lớp của Spring để lấy dòng thông báo lỗi thật sự (Từ Trigger MySQL)
            Throwable rootCause = e;
            while (rootCause.getCause() != null) {
                rootCause = rootCause.getCause();
            }
            
            // Trả về mã lỗi 400 kèm câu thông báo chuẩn
            return ResponseEntity.status(400).body(Map.of("message", rootCause.getMessage()));
        }
    }

    @PostMapping("/auto-assign")
    public ResponseEntity<Map<String, String>> autoAssign(@RequestParam Integer semesterId) {
        String resultMsg = service.autoAssign(semesterId, 2);
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
        // Chuyển đổi từ "Thứ 2" của giao diện sang "MON" của Database
        String dowCode = "SUN";
        if (dayOfWeek.contains("2")) dowCode = "MON";
        else if (dayOfWeek.contains("3")) dowCode = "TUE";
        else if (dayOfWeek.contains("4")) dowCode = "WED";
        else if (dayOfWeek.contains("5")) dowCode = "THU";
        else if (dayOfWeek.contains("6")) dowCode = "FRI";
        else if (dayOfWeek.contains("7")) dowCode = "SAT";

        return ResponseEntity.ok(service.getAvailableRooms(semesterId, dowCode, slot, expectedAttendees, roomType));
    }
}