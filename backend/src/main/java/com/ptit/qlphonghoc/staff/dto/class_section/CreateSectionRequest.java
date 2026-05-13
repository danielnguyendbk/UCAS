package com.ptit.qlphonghoc.staff.dto.class_section;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class CreateSectionRequest {

    @NotNull(message = "semesterId không được để trống")
    private Integer semesterId;

    @NotNull(message = "courseId không được để trống")
    private Integer courseId;

    @NotNull(message = "lecturerId không được để trống")
    private Integer lecturerId;

    @NotBlank(message = "sectionCode không được để trống")
    private String sectionCode;

    @Min(value = 0, message = "enrolledCount phải >= 0")
    private Integer enrolledCount = 0;

    @NotNull(message = "maxCapacity không được để trống")
    @Min(value = 1, message = "maxCapacity phải > 0")
    private Integer maxCapacity;

    @Pattern(
            regexp = "(?i)^(ACTIVE|CANCELLED|COMPLETED)$",
            message = "status chỉ nhận ACTIVE, CANCELLED hoặc COMPLETED"
    )
    private String status = "ACTIVE";

    @NotBlank(message = "day không được để trống")
    private String day;

    @NotNull(message = "slot không được để trống")
    @Min(value = 1, message = "slot phải từ 1 đến 5")
    @Max(value = 5, message = "slot phải từ 1 đến 5")
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

    public Integer getSlot() {
        return slot;
    }

    public void setSlot(Integer slot) {
        this.slot = slot;
    }
}