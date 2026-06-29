package com.ptit.qlphonghoc.student.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.student.dto.timetable.StudentTimetableResponse;
import com.ptit.qlphonghoc.student.service.StudentTimetableService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/student/timetable")
public class StudentTimetableController {

    private final StudentTimetableService service;

    public StudentTimetableController(StudentTimetableService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<StudentTimetableResponse>> getMyTimetable(
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
