package com.ptit.qlphonghoc.staff.dto.allocation;

public class ConflictResponse {
    private Integer scheduleId;
    private String conflictType;
    private String severity; // HIGH, MEDIUM, LOW
    private String dayOfWeek;
    private Integer slotNumber;
    private String roomCode;
    private String description;
    private String classCode;
    private String courseCode;
    private String sectionCode;
    private String courseName;
    private String lecturerName;
    private Integer enrolledCount;
    private Integer maxCapacity;
    private String requiredRoomType;
    private Integer slotEndNumber;
    private String conflictingWith;

    // Getters and Setters
    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }
    public String getConflictType() { return conflictType; }
    public void setConflictType(String conflictType) { this.conflictType = conflictType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public Integer getSlotNumber() { return slotNumber; }
    public void setSlotNumber(Integer slotNumber) { this.slotNumber = slotNumber; }
    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getLecturerName() { return lecturerName; }
    public void setLecturerName(String lecturerName) { this.lecturerName = lecturerName; }
    public Integer getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(Integer enrolledCount) { this.enrolledCount = enrolledCount; }
    public Integer getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; }
    public String getRequiredRoomType() { return requiredRoomType; }
    public void setRequiredRoomType(String requiredRoomType) { this.requiredRoomType = requiredRoomType; }
    public Integer getSlotEndNumber() { return slotEndNumber; }
    public void setSlotEndNumber(Integer slotEndNumber) { this.slotEndNumber = slotEndNumber; }
    public String getConflictingWith() { return conflictingWith; }
    public void setConflictingWith(String conflictingWith) { this.conflictingWith = conflictingWith; }
}
