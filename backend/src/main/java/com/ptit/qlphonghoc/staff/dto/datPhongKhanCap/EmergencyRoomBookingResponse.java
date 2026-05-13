package com.ptit.qlphonghoc.staff.dto.datPhongKhanCap;

import java.time.LocalDate;

public class EmergencyRoomBookingResponse {

    private Integer id;
    private String requestTitle;
    private String targetType;
    private String recipientName;
    private String recipientCode;

    private Integer semesterId;
    private LocalDate bookingDate;
    private Integer slot;
    private String periodText;

    private Integer classroomId;
    private String roomCode;

    private Integer expectedAttendees;
    private String purpose;
    private String emergencyReason;

    private String status;
    private Integer approvedBy;

    public EmergencyRoomBookingResponse() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getRequestTitle() {
        return requestTitle;
    }

    public void setRequestTitle(String requestTitle) {
        this.requestTitle = requestTitle;
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

    public Integer getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Integer semesterId) {
        this.semesterId = semesterId;
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

    public String getPeriodText() {
        return periodText;
    }

    public void setPeriodText(String periodText) {
        this.periodText = periodText;
    }

    public Integer getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Integer classroomId) {
        this.classroomId = classroomId;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Integer approvedBy) {
        this.approvedBy = approvedBy;
    }
}