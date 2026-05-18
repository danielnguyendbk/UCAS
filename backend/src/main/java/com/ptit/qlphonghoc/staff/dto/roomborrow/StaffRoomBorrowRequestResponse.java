package com.ptit.qlphonghoc.staff.dto.roomborrow;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class StaffRoomBorrowRequestResponse {

    private Integer id;
    private String requestTitle;
    private String requestType;
    private String bookingScope;
    private Integer semesterId;
    private String semesterName;
    private LocalDate bookingDate;
    private Integer slot;
    private String periodText;
    private Integer requestedBy;
    private String requesterName;
    private String requesterUsername;
    private String requesterRole;
    private Integer clubId;
    private String clubName;
    private Integer sectionId;
    private String sectionCode;
    private String courseName;
    private Integer expectedAttendees;
    private Integer preferredClassroomId;
    private String preferredRoomCode;
    private Integer preferredRoomCapacity;
    private Integer approvedClassroomId;
    private String approvedRoomCode;
    private String requestedRoomType;
    private String purposeNote;
    private String status;
    private String availabilityStatus;
    private String processingNote;
    private String rejectReason;
    private Integer approvedBy;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;

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

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getBookingScope() {
        return bookingScope;
    }

    public void setBookingScope(String bookingScope) {
        this.bookingScope = bookingScope;
    }

    public Integer getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Integer semesterId) {
        this.semesterId = semesterId;
    }

    public String getSemesterName() {
        return semesterName;
    }

    public void setSemesterName(String semesterName) {
        this.semesterName = semesterName;
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

    public Integer getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(Integer requestedBy) {
        this.requestedBy = requestedBy;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public String getRequesterUsername() {
        return requesterUsername;
    }

    public void setRequesterUsername(String requesterUsername) {
        this.requesterUsername = requesterUsername;
    }

    public String getRequesterRole() {
        return requesterRole;
    }

    public void setRequesterRole(String requesterRole) {
        this.requesterRole = requesterRole;
    }

    public Integer getClubId() {
        return clubId;
    }

    public void setClubId(Integer clubId) {
        this.clubId = clubId;
    }

    public String getClubName() {
        return clubName;
    }

    public void setClubName(String clubName) {
        this.clubName = clubName;
    }

    public Integer getSectionId() {
        return sectionId;
    }

    public void setSectionId(Integer sectionId) {
        this.sectionId = sectionId;
    }

    public String getSectionCode() {
        return sectionCode;
    }

    public void setSectionCode(String sectionCode) {
        this.sectionCode = sectionCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
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

    public String getPreferredRoomCode() {
        return preferredRoomCode;
    }

    public void setPreferredRoomCode(String preferredRoomCode) {
        this.preferredRoomCode = preferredRoomCode;
    }

    public Integer getPreferredRoomCapacity() {
        return preferredRoomCapacity;
    }

    public void setPreferredRoomCapacity(Integer preferredRoomCapacity) {
        this.preferredRoomCapacity = preferredRoomCapacity;
    }

    public Integer getApprovedClassroomId() {
        return approvedClassroomId;
    }

    public void setApprovedClassroomId(Integer approvedClassroomId) {
        this.approvedClassroomId = approvedClassroomId;
    }

    public String getApprovedRoomCode() {
        return approvedRoomCode;
    }

    public void setApprovedRoomCode(String approvedRoomCode) {
        this.approvedRoomCode = approvedRoomCode;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getProcessingNote() {
        return processingNote;
    }

    public void setProcessingNote(String processingNote) {
        this.processingNote = processingNote;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }

    public Integer getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Integer approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getApprovedByName() {
        return approvedByName;
    }

    public void setApprovedByName(String approvedByName) {
        this.approvedByName = approvedByName;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
