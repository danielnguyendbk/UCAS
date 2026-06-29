package com.ptit.qlphonghoc.staff.dto.class_section;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.ArrayList;
import java.util.List;

public class CreateSectionRequest {

    @NotNull(message = "semesterId khong duoc de trong")
    private Integer semesterId;

    @NotNull(message = "courseId khong duoc de trong")
    private Integer courseId;

    @NotNull(message = "lecturerId khong duoc de trong")
    private Integer lecturerId;

    @NotBlank(message = "sectionCode khong duoc de trong")
    private String sectionCode;

    @NotBlank(message = "className khong duoc de trong")
    private String className;

    private List<Integer> classIds = new ArrayList<>();

    @Min(value = 0, message = "enrolledCount phai >= 0")
    private Integer enrolledCount = 0;

    @NotNull(message = "maxCapacity khong duoc de trong")
    @Min(value = 1, message = "maxCapacity phai > 0")
    private Integer maxCapacity;

    @Pattern(
            regexp = "(?i)^(ACTIVE|CANCELLED|COMPLETED)$",
            message = "status chi nhan ACTIVE, CANCELLED hoac COMPLETED"
    )
    private String status = "ACTIVE";

    @NotBlank(message = "day khong duoc de trong")
    private String day;

    private Integer classroomId;

    @NotNull(message = "slotStartId khong duoc de trong")
    @Min(value = 1, message = "slotStartId phai > 0")
    private Integer slotStartId;

    @NotNull(message = "slotEndId khong duoc de trong")
    @Min(value = 1, message = "slotEndId phai > 0")
    private Integer slotEndId;

    // Legacy field kept only so older clients do not fail JSON binding.
    private Integer slot;

    public CreateSectionRequest() {
    }

    public Integer getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Integer semesterId) {
        this.semesterId = semesterId;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }

    public Integer getLecturerId() {
        return lecturerId;
    }

    public void setLecturerId(Integer lecturerId) {
        this.lecturerId = lecturerId;
    }

    public String getSectionCode() {
        return sectionCode;
    }

    public void setSectionCode(String sectionCode) {
        this.sectionCode = sectionCode;
    }

    public List<Integer> getClassIds() {
        return classIds;
    }

    public void setClassIds(List<Integer> classIds) {
        this.classIds = classIds;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public Integer getEnrolledCount() {
        return enrolledCount;
    }

    public void setEnrolledCount(Integer enrolledCount) {
        this.enrolledCount = enrolledCount;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public Integer getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Integer classroomId) {
        this.classroomId = classroomId;
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
}
