package com.ptit.qlphonghoc.auth.dto;

public record FacilityProfileResponse(
        Integer facilityStaffId,
        String staffCode,
        Integer buildingId,
        String note
) {
}
