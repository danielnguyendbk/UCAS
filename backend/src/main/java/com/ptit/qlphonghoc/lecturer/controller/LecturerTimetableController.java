package com.ptit.qlphonghoc.lecturer.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.lecturer.dto.timetable.LecturerTimetableResponse;
import com.ptit.qlphonghoc.lecturer.service.LecturerTimetableService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/lecturer/timetable")
public class LecturerTimetableController {

    private final LecturerTimetableService service;

    public LecturerTimetableController(LecturerTimetableService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<LecturerTimetableResponse>> getMyTimetable(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStartDate
    ) {
        return ApiResponse.success(
                "OK",
                service.getMyTimetable(userDetails.getUserId(), semesterId, weekStartDate)
        );
    }
}
