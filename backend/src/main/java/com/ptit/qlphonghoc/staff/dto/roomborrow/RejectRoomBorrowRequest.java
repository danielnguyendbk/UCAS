package com.ptit.qlphonghoc.staff.dto.roomborrow;

import jakarta.validation.constraints.NotBlank;

public class RejectRoomBorrowRequest {

    @NotBlank(message = "rejectReason is required")
    private String rejectReason;

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }
}
