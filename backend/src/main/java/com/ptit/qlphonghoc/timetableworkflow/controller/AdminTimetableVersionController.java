package com.ptit.qlphonghoc.timetableworkflow.controller;

import com.ptit.qlphonghoc.auth.service.CustomUserDetails;
import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableDiffResult;
import com.ptit.qlphonghoc.timetableworkflow.entity.TimetableVersion;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableVersionService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/timetable-versions")
public class AdminTimetableVersionController {

    private final TimetableVersionService versionService;

    public AdminTimetableVersionController(TimetableVersionService versionService) {
        this.versionService = versionService;
    }

    @GetMapping
    public ApiResponse<?> getVersions(
            @RequestParam(required = false) Integer semesterId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        List<TimetableVersion> list = versionService.getVersions(semesterId, search);

        if (page != null || size != null) {
            PageResponse<TimetableVersion> pageResponse = PageResponse.from(list, page, size);
            return ApiResponse.success("OK", pageResponse);
        }

        return ApiResponse.success("OK", list);
    }

    @GetMapping("/diff")
    public ApiResponse<TimetableDiffResult> getDiff(
            @RequestParam Long semesterId,
            @RequestParam Integer versionA,
            @RequestParam Integer versionB
    ) {
        TimetableDiffResult result = versionService.computeDiff(semesterId, versionA, versionB);
        return ApiResponse.success("OK", result);
    }

    @PostMapping("/rollback")
    public ApiResponse<?> rollback(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long semesterId = Long.valueOf(body.get("semesterId").toString());
        Integer versionNo = Integer.valueOf(body.get("versionNo").toString());
        Map<String, Object> result = versionService.rollback(semesterId, versionNo, userDetails.getUserId());
        return ApiResponse.success("Rollback thành công.", result);
    }
}
