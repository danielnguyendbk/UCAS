package com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap;

import jakarta.validation.constraints.NotBlank;

public class RejectEmergencyRoomChangeRequest {

    @NotBlank(message = "rejectReason khong duoc de trong")
    private String rejectReason;

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }
}
