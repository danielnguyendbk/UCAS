package com.ptit.qlphonghoc.staff.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "class_sections")
public class ClassSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "semester_id", nullable = false)
    private Integer semesterId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "lecturer_id", nullable = false)
    private Integer lecturerId;

    @Column(name = "section_code", nullable = false, length = 10)
    private String sectionCode;

    @Column(name = "enrolled_count", nullable = false)
    private Integer enrolledCount = 0;

    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity;

    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public ClassSection() {
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}