package com.ptit.qlphonghoc.staff.controller;

import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.maintenance.dto.MaintenanceRequestResponse;
import com.ptit.qlphonghoc.maintenance.dto.UpdateMaintenanceStatusRequest;
import com.ptit.qlphonghoc.maintenance.service.MaintenanceRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/maintenance-requests")
public class StaffMaintenanceRequestController {

    private final MaintenanceRequestService service;

    public StaffMaintenanceRequestController(MaintenanceRequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceRequestResponse>> getRequests(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(service.getAllRequests(status));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<MaintenanceRequestResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateMaintenanceStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(service.updateStatus(
                id,
                request.status(),
                request.resolutionNote(),
                userDetails.getUserId()
        ));
    }
}
