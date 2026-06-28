package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.staff.service.StaffExamAllocationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/staff/exams")
public class StaffExamAllocationController {

    private final StaffExamAllocationService service;

    public StaffExamAllocationController(StaffExamAllocationService service) {
        this.service = service;
    }

    @GetMapping({"", "/schedule", "/allocations"})
    public ApiResponse<List<Map<String, Object>>> getAllocations(
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(
                "Tải danh sách phân phòng thi thành công.",
                service.getAllocations(semesterId, status)
        );
    }

    @GetMapping("/conflicts")
    public ApiResponse<List<Map<String, Object>>> getConflicts(
            @RequestParam Long semesterId,
            @RequestParam(required = false) String conflictType
    ) {
        return ApiResponse.success(
                "Tải danh sách xung đột phòng thi thành công.",
                service.getConflicts(semesterId, conflictType)
        );
    }

    @GetMapping("/workflow/status")
    public ApiResponse<Map<String, Object>> getWorkflowStatus(@RequestParam Long semesterId) {
        return ApiResponse.success(
                "Tải trạng thái workflow lịch thi thành công.",
                service.getWorkflowStatus(semesterId)
        );
    }

    @PostMapping({"/auto-assign", "/allocations/auto-assign", "/auto-assignment"})
    public ApiResponse<Map<String, Object>> autoAssign(
            @RequestParam(required = false) Long semesterId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        Long resolvedSemesterId = resolveSemesterId(semesterId, body);
        return ApiResponse.success(
                "Chạy phân phòng thi tự động thành công.",
                service.autoAssign(resolvedSemesterId)
        );
    }

    @PostMapping({"/validate", "/allocations/validate"})
    public ApiResponse<Map<String, Object>> validate(
            @RequestParam(required = false) Long semesterId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        Long resolvedSemesterId = resolveSemesterId(semesterId, body);
        return ApiResponse.success(
                "Kiểm tra xung đột lịch thi thành công.",
                service.validate(resolvedSemesterId)
        );
    }

    @PostMapping({"/submit", "/workflow/submit", "/approval-submit"})
    public ApiResponse<Map<String, Object>> submit(
            @RequestParam(required = false) Long semesterId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        Long resolvedSemesterId = resolveSemesterId(semesterId, body);
        return ApiResponse.success(
                "Gửi lịch thi cho Admin duyệt thành công.",
                service.submitForApproval(resolvedSemesterId)
        );
    }


    @GetMapping("/{examId}/edit-options")
    public ApiResponse<Map<String, Object>> getEditOptions(@PathVariable Long examId) {
        return ApiResponse.success(
                "Tải dữ liệu chỉnh sửa ca thi thành công.",
                service.getEditOptions(examId)
        );
    }

    @PatchMapping("/{examId}")
    public ApiResponse<Map<String, Object>> updateExamAllocation(
            @PathVariable Long examId,
            @RequestBody Map<String, Object> body
    ) {
        return ApiResponse.success(
                "Cập nhật ca thi thành công.",
                service.updateExamAllocation(examId, body)
        );
    }

    @PatchMapping("/{examId}/note")
    public ApiResponse<Map<String, Object>> saveExamNote(
            @PathVariable Long examId,
            @RequestBody Map<String, Object> body
    ) {
        Object rawNote = body == null ? null : body.get("note");
        String note = rawNote == null ? null : String.valueOf(rawNote);
        return ApiResponse.success(
                "Đã lưu ghi chú cho Admin.",
                service.saveExamNote(examId, note)
        );
    }

    @DeleteMapping("/{examId}")
    public ApiResponse<Map<String, Object>> cancelExam(@PathVariable Long examId) {
        return ApiResponse.success(
                "Đã hủy ca thi.",
                service.cancelExam(examId)
        );
    }

    @PatchMapping("/{examId}/room")
    public ApiResponse<Map<String, Object>> assignRoom(
            @PathVariable Long examId,
            @RequestBody AssignRoomRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật phòng thi thành công.",
                service.assignRoom(examId, request == null ? null : request.classroomCode())
        );
    }

    @GetMapping("/available-rooms")
    public ApiResponse<List<Map<String, Object>>> getAvailableRooms(
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) String examDate,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Long excludeExamId
    ) {
        return ApiResponse.success(
                "Tải danh sách phòng trống thành công.",
                service.getAvailableRooms(semesterId, examDate, startTime, endTime, minCapacity, excludeExamId)
        );
    }

    @GetMapping("/classroom-schedule")
    public ApiResponse<List<Map<String, Object>>> getClassroomSchedule(
            @RequestParam(required = false) Long semesterId
    ) {
        return ApiResponse.success(
                "Tải lịch thi theo phòng thành công.",
                service.getClassroomSchedule(semesterId)
        );
    }

    @PostMapping("/{examId}/assign-room")
    public ApiResponse<Map<String, Object>> assignRoomAlias(
            @PathVariable Long examId,
            @RequestBody AssignRoomRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật phòng thi thành công.",
                service.assignRoom(examId, request == null ? null : request.classroomCode())
        );
    }

    @PostMapping("/assign-room")
    public ApiResponse<Map<String, Object>> assignRoomBody(@RequestBody Map<String, Object> body) {
        Long examId = toLong(body == null ? null : body.get("examId"));
        String classroomCode = body == null ? null : String.valueOf(body.getOrDefault("classroomCode", ""));

        return ApiResponse.success(
                "Cập nhật phòng thi thành công.",
                service.assignRoom(examId, classroomCode)
        );
    }

    private static Long resolveSemesterId(Long requestParam, Map<String, Object> body) {
        if (requestParam != null) return requestParam;
        if (body == null) return null;
        return toLong(body.get("semesterId"));
    }

    private static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();

        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) return null;

        return Long.parseLong(text);
    }



    public record AssignRoomRequest(String classroomCode) {}
}
