package com.ptit.qlphonghoc.staff.dto.doiPhongKhanCap;

public class EmergencyRoomChangeScheduleResponse {

    private Integer scheduleId;
    private Integer semesterId;
    private Integer sectionId;
    private String classCode;
    private String courseName;
    private String lecturerName;
    private String dayOfWeekCode;
    private String dayOfWeekText;
    private Integer slotNumber;
    private Integer currentClassroomId;
    private String currentRoomCode;
    private Integer maxCapacity;
    private String requiredRoomType;

    public Integer getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(Integer scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Integer getSemesterId() {
        return semesterId;
    }

    public void setSemesterId(Integer semesterId) {
        this.semesterId = semesterId;
    }

    public Integer getSectionId() {
        return sectionId;
    }

    public void setSectionId(Integer sectionId) {
        this.sectionId = sectionId;
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

    public String getDayOfWeekCode() {
        return dayOfWeekCode;
    }

    public void setDayOfWeekCode(String dayOfWeekCode) {
        this.dayOfWeekCode = dayOfWeekCode;
    }

    public String getDayOfWeekText() {
        return dayOfWeekText;
    }

    public void setDayOfWeekText(String dayOfWeekText) {
        this.dayOfWeekText = dayOfWeekText;
    }

    public Integer getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(Integer slotNumber) {
        this.slotNumber = slotNumber;
    }

    public Integer getCurrentClassroomId() {
        return currentClassroomId;
    }

    public void setCurrentClassroomId(Integer currentClassroomId) {
        this.currentClassroomId = currentClassroomId;
    }

    public String getCurrentRoomCode() {
        return currentRoomCode;
    }

    public void setCurrentRoomCode(String currentRoomCode) {
        this.currentRoomCode = currentRoomCode;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public String getRequiredRoomType() {
        return requiredRoomType;
    }

    public void setRequiredRoomType(String requiredRoomType) {
        this.requiredRoomType = requiredRoomType;
    }
}
