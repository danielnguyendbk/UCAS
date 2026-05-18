package com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class EmergencyRoomChangeResponse {

    private Integer id;
    private Integer semesterId;
    private Integer sectionScheduleId;
    private String classCode;
    private String courseName;
    private String lecturerName;
    private String dayOfWeek;
    private Integer slot;
    private String changeScope;
    private LocalDate targetDate;
    private Integer fromWeek;
    private Integer toWeek;
    private Integer oldClassroomId;
    private String oldRoomCode;
    private Integer requestedClassroomId;
    private String requestedRoomCode;
    private Integer newClassroomId;
    private String newRoomCode;
    private String reason;
    private Integer requestedBy;
    private String requesterName;
    private String requesterUsername;
    private String status;
    private Boolean active;
    private Integer reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String reviewNote;
    private String rejectReason;
    private LocalDateTime createdAt;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Integer semesterId) {
        this.semesterId = semesterId;
    }

    public Integer getSectionScheduleId() {
        return sectionScheduleId;
    }

    public void setSectionScheduleId(Integer sectionScheduleId) {
        this.sectionScheduleId = sectionScheduleId;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public String getLecturerName() {
        return lecturerName;
    }

    public void setLecturerName(String lecturerName) {
        this.lecturerName = lecturerName;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public Integer getSlot() {
        return slot;
    }

    public void setSlot(Integer slot) {
        this.slot = slot;
    }

    public String getChangeScope() {
        return changeScope;
    }

    public void setChangeScope(String changeScope) {
        this.changeScope = changeScope;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
    }

    public Integer getFromWeek() {
        return fromWeek;
    }

    public void setFromWeek(Integer fromWeek) {
        this.fromWeek = fromWeek;
    }

    public Integer getToWeek() {
        return toWeek;
    }

    public void setToWeek(Integer toWeek) {
        this.toWeek = toWeek;
    }

    public Integer getOldClassroomId() {
        return oldClassroomId;
    }

    public void setOldClassroomId(Integer oldClassroomId) {
        this.oldClassroomId = oldClassroomId;
    }

    public String getOldRoomCode() {
        return oldRoomCode;
    }

    public void setOldRoomCode(String oldRoomCode) {
        this.oldRoomCode = oldRoomCode;
    }

    public Integer getRequestedClassroomId() {
        return requestedClassroomId;
    }

    public void setRequestedClassroomId(Integer requestedClassroomId) {
        this.requestedClassroomId = requestedClassroomId;
    }

    public String getRequestedRoomCode() {
        return requestedRoomCode;
    }

    public void setRequestedRoomCode(String requestedRoomCode) {
        this.requestedRoomCode = requestedRoomCode;
    }

    public Integer getNewClassroomId() {
        return newClassroomId;
    }

    public void setNewClassroomId(Integer newClassroomId) {
        this.newClassroomId = newClassroomId;
    }

    public String getNewRoomCode() {
        return newRoomCode;
    }

    public void setNewRoomCode(String newRoomCode) {
        this.newRoomCode = newRoomCode;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public Integer getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(Integer reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getReviewedByName() {
        return reviewedByName;
    }

    public void setReviewedByName(String reviewedByName) {
        this.reviewedByName = reviewedByName;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
