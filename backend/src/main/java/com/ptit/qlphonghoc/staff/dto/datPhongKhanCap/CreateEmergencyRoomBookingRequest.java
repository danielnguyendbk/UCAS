package com.ptit.qlphonghoc.staff.dto.datPhongKhanCap;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateEmergencyRoomBookingRequest {

    @NotNull(message = "semesterId không được để trống")
    private Integer semesterId;

    /*
     * STUDENT, LECTURER, CLASS, DEPARTMENT, CLUB, OTHER
     */
    @NotBlank(message = "targetType không được để trống")
    private String targetType;

    @NotBlank(message = "recipientName không được để trống")
    private String recipientName;

    private String recipientCode;

    @NotNull(message = "expectedAttendees không được để trống")
    @Min(value = 1, message = "Số người dự kiến phải > 0")
    private Integer expectedAttendees;

    @NotNull(message = "classroomId không được để trống")
    private Integer classroomId;

    @NotNull(message = "bookingDate không được để trống")
    private LocalDate bookingDate;

    @NotNull(message = "slot không được để trống")
    @Min(value = 1, message = "slot phải từ 1 đến 5")
    @Max(value = 5, message = "slot phải từ 1 đến 5")
    private Integer slot;

    @NotBlank(message = "purpose không được để trống")
    private String purpose;

    @NotBlank(message = "emergencyReason không được để trống")
    private String emergencyReason;

    /*
     * ID user staff đang tạo yêu cầu.
     * Sau này có JWT thì bỏ field này và lấy từ token.
     */
    @NotNull(message = "staffUserId không được để trống")
    private Integer staffUserId;

    public CreateEmergencyRoomBookingRequest() {
    }

    public Integer getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Integer semesterId) {
        this.semesterId = semesterId;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientCode() {
        return recipientCode;
    }

    public void setRecipientCode(String recipientCode) {
        this.recipientCode = recipientCode;
    }

    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }

    public Integer getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Integer classroomId) {
        this.classroomId = classroomId;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }

    public Integer getSlot() {
        return slot;
    }

    public void setSlot(Integer slot) {
        this.slot = slot;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getEmergencyReason() {
        return emergencyReason;
    }

    public void setEmergencyReason(String emergencyReason) {
        this.emergencyReason = emergencyReason;
    }

    public Integer getStaffUserId() {
        return staffUserId;
    }

    public void setStaffUserId(Integer staffUserId) {
        this.staffUserId = staffUserId;
    }
}