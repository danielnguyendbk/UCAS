package com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap;

import java.time.LocalDate;

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
    private Integer newClassroomId;
    private String newRoomCode;
    private String reason;
    private String status;
    private Boolean active;
    private Integer reviewedBy;

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
}
