package com.ptit.qlphonghoc.student.dto.roomborrow;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateStudentRoomBorrowRequest {

    @NotNull(message = "semesterId is required")
    private Integer semesterId;

    @NotBlank(message = "requestType is required")
    private String requestType;

    private String clubCode;

    @NotNull(message = "bookingDate is required")
    private LocalDate bookingDate;

    @NotNull(message = "slot is required")
    @Min(value = 1, message = "slot must be from 1 to 5")
    @Max(value = 5, message = "slot must be from 1 to 5")
    private Integer slot;

    @NotNull(message = "expectedAttendees is required")
    @Min(value = 1, message = "expectedAttendees must be greater than 0")
    private Integer expectedAttendees;

    private Integer preferredClassroomId;

    private String requestedRoomType;

    @NotBlank(message = "purposeNote is required")
    private String purposeNote;

    public Integer getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Integer semesterId) {
        this.semesterId = semesterId;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getClubCode() {
        return clubCode;
    }

    public void setClubCode(String clubCode) {
        this.clubCode = clubCode;
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

    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }

    public Integer getPreferredClassroomId() {
        return preferredClassroomId;
    }

    public void setPreferredClassroomId(Integer preferredClassroomId) {
        this.preferredClassroomId = preferredClassroomId;
    }

    public String getRequestedRoomType() {
        return requestedRoomType;
    }

    public void setRequestedRoomType(String requestedRoomType) {
        this.requestedRoomType = requestedRoomType;
    }

    public String getPurposeNote() {
        return purposeNote;
    }

    public void setPurposeNote(String purposeNote) {
        this.purposeNote = purposeNote;
    }
}
