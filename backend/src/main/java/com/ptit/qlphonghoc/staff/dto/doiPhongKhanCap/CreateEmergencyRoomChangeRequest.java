package com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateEmergencyRoomChangeRequest {

    @NotNull(message = "semesterId khong duoc de trong")
    private Integer semesterId;

    @NotNull(message = "sectionScheduleId khong duoc de trong")
    private Integer sectionScheduleId;

    @NotBlank(message = "changeScope khong duoc de trong")
    private String changeScope;

    private LocalDate targetDate;

    private Integer fromWeek;

    private Integer toWeek;

    @NotNull(message = "newClassroomId khong duoc de trong")
    private Integer newClassroomId;

    @NotBlank(message = "reason khong duoc de trong")
    private String reason;

    @NotNull(message = "staffUserId khong duoc de trong")
    private Integer staffUserId;

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

    public Integer getNewClassroomId() {
        return newClassroomId;
    }

    public void setNewClassroomId(Integer newClassroomId) {
        this.newClassroomId = newClassroomId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getStaffUserId() {
        return staffUserId;
    }

    public void setStaffUserId(Integer staffUserId) {
        this.staffUserId = staffUserId;
    }
}
