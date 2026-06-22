package com.ptit.qlphonghoc.timetableworkflow.controller;

import com.ptit.qlphonghoc.common.response.ApiResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableDiffResult;
import com.ptit.qlphonghoc.timetableworkflow.entity.TimetableVersion;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableVersionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
