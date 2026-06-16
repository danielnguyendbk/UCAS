package com.ptit.qlphonghoc.student.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.maintenance.dto.CreateMaintenanceRequest;
import com.ptit.qlphonghoc.maintenance.dto.MaintenanceRequestResponse;
import com.ptit.qlphonghoc.maintenance.service.MaintenanceRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/student/maintenance-requests")
public class StudentMaintenanceRequestController {

    private final MaintenanceRequestService service;

    public StudentMaintenanceRequestController(MaintenanceRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceRequestResponse>> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.getMyRequests(userDetails.getUserId()));
    }

    @PostMapping
    public ResponseEntity<MaintenanceRequestResponse> create(
            @Valid @RequestBody CreateMaintenanceRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        MaintenanceRequestResponse response = service.create(request, userDetails.getUserId());
        return ResponseEntity
                .created(URI.create("/api/student/maintenance-requests/" + response.id()))
                .body(response);
    }
}
