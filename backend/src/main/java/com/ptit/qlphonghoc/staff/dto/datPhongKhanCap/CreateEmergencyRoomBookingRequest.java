package com.ptit.qlphonghoc.staff.dto.datPhongKhanCap;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateEmergencyRoomBookingRequest {

    @NotNull(message = "semesterId is required")
    private Integer semesterId;

    /*
     * STUDENT, LECTURER, CLASS, DEPARTMENT, CLUB, OTHER
     */
    @NotBlank(message = "targetType is required")
    private String targetType;

    @NotBlank(message = "recipientName is required")
    private String recipientName;

    private String recipientCode;

    @NotNull(message = "expectedAttendees is required")
    @Min(value = 1, message = "expectedAttendees must be greater than 0")
    private Integer expectedAttendees;

    @NotNull(message = "classroomId is required")
    private Integer classroomId;

    @NotNull(message = "bookingDate is required")
    private LocalDate bookingDate;

    @Min(value = 1, message = "slotStartId must be greater than 0")
    private Integer slotStartId;

    @Min(value = 1, message = "slotEndId must be greater than 0")
    private Integer slotEndId;

    // Legacy field kept for older clients; new UI sends slotStartId/slotEndId.
    @Min(value = 1, message = "slot must be greater than 0")
    private Integer slot;

    @NotBlank(message = "purpose is required")
    private String purpose;

    @NotBlank(message = "emergencyReason is required")
    private String emergencyReason;

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

    public Integer getSlotStartId() {
        return slotStartId;
    }

    public void setSlotStartId(Integer slotStartId) {
        this.slotStartId = slotStartId;
    }

    public Integer getSlotEndId() {
        return slotEndId;
    }

    public void setSlotEndId(Integer slotEndId) {
        this.slotEndId = slotEndId;
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
}
