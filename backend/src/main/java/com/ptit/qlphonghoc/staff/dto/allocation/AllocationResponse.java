package com.ptit.qlphonghoc.staff.dto.allocation;

public class AllocationResponse {
    private Integer sectionId;
    private String classCode;
    private String sectionCode;
    private String courseName;
    private String lecturerName;
    private Integer enrolledCount;
    private Integer maxCapacity; // THÊM DÒNG NÀY
    private String requiredRoomType;
    private String dayOfWeek;
    private Integer slotNumber;
    private String assignedRoom;
    private Integer classroomId;
    private Integer roomCapacity;
    private String scheduleStatus;
    private String allocationStatus;
    private String status;
    private Integer scheduleId;
    private Integer slotEndNumber;
    private Integer fromWeekNo;
    private Integer toWeekNo;
    private String validationStatus;
    private String conflictReason;
    private String note;

    // Getters and Setters
    public Integer getSectionId() { return sectionId; }
    public void setSectionId(Integer sectionId) { this.sectionId = sectionId; }
    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }
    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getLecturerName() { return lecturerName; }
    public void setLecturerName(String lecturerName) { this.lecturerName = lecturerName; }
    public Integer getEnrolledCount() { return enrolledCount; }
    public void setEnrolledCount(Integer enrolledCount) { this.enrolledCount = enrolledCount; }
    
    public Integer getMaxCapacity() { return maxCapacity; } // THÊM GETTER
    public void setMaxCapacity(Integer maxCapacity) { this.maxCapacity = maxCapacity; } // THÊM SETTER

    public String getRequiredRoomType() { return requiredRoomType; }
    public void setRequiredRoomType(String requiredRoomType) { this.requiredRoomType = requiredRoomType; }
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public Integer getSlotNumber() { return slotNumber; }
    public void setSlotNumber(Integer slotNumber) { this.slotNumber = slotNumber; }
    public String getAssignedRoom() { return assignedRoom; }
    public void setAssignedRoom(String assignedRoom) { this.assignedRoom = assignedRoom; }
    public Integer getClassroomId() { return classroomId; }
    public void setClassroomId(Integer classroomId) { this.classroomId = classroomId; }
    public Integer getRoomCapacity() { return roomCapacity; }
    public void setRoomCapacity(Integer roomCapacity) { this.roomCapacity = roomCapacity; }
    public String getScheduleStatus() { return scheduleStatus; }
    public void setScheduleStatus(String scheduleStatus) { this.scheduleStatus = scheduleStatus; }
    public String getAllocationStatus() { return allocationStatus; }
    public void setAllocationStatus(String allocationStatus) { this.allocationStatus = allocationStatus; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }
    public Integer getSlotEndNumber() { return slotEndNumber; }
    public void setSlotEndNumber(Integer slotEndNumber) { this.slotEndNumber = slotEndNumber; }
    public Integer getFromWeekNo() { return fromWeekNo; }
    public void setFromWeekNo(Integer fromWeekNo) { this.fromWeekNo = fromWeekNo; }
    public Integer getToWeekNo() { return toWeekNo; }
    public void setToWeekNo(Integer toWeekNo) { this.toWeekNo = toWeekNo; }
    public String getValidationStatus() { return validationStatus; }
    public void setValidationStatus(String validationStatus) { this.validationStatus = validationStatus; }
    public String getConflictReason() { return conflictReason; }
    public void setConflictReason(String conflictReason) { this.conflictReason = conflictReason; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
