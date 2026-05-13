package com.ptit.qlphonghoc.staff.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateTimetableSessionRequest {

    @NotNull(message = "sectionId không được để trống")
    private Integer sectionId;

    @NotBlank(message = "day không được để trống")
    private String day;

    @NotNull(message = "slot không được để trống")
    @Min(value = 1, message = "slot phải từ 1 đến 5")
    @Max(value = 5, message = "slot phải từ 1 đến 5")
    private Integer slot;

    @NotNull(message = "classroomId không được để trống")
    private Integer classroomId;

    @NotNull(message = "assignedBy không được để trống")
    private Integer assignedBy;

    private String note;

    public CreateTimetableSessionRequest() {
    }

    public Integer getSectionId() {
        return sectionId;
    }

    public void setSectionId(Integer sectionId) {
        this.sectionId = sectionId;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public Integer getSlot() {
        return slot;
    }

    public void setSlot(Integer slot) {
        this.slot = slot;
    }

    public Integer getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Integer classroomId) {
        this.classroomId = classroomId;
    }

    public Integer getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(Integer assignedBy) {
        this.assignedBy = assignedBy;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}