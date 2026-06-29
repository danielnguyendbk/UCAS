package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.classsession.dto.ClassSessionResponse;
import com.ptit.qlphonghoc.classsession.service.ClassSessionService;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/staff/class-sessions")
public class StaffClassSessionController {

    private final ClassSessionService classSessionService;

    public StaffClassSessionController(ClassSessionService classSessionService) {
        this.classSessionService = classSessionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getStaffClassSessions(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) Integer weekNo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer lecturerId,
            @RequestParam(required = false) Integer classroomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        List<ClassSessionResponse> list = classSessionService.getStaffClassSessions(
                semesterId,
                weekNo,
                status,
                lecturerId,
                classroomId,
                date,
                startDate,
                endDate,
                search
        );

        if (page != null || size != null) {
            PageResponse<ClassSessionResponse> pageResponse = PageResponse.from(list, page, size);
            return ResponseEntity.ok(ApiResponse.success("Success", pageResponse));
        }

        return ResponseEntity.ok(ApiResponse.success("Success", list));
    }
}
