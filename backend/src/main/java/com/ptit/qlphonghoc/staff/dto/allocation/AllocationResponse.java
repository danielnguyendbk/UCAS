package com.ptit.qlphonghoc.staff.dto.allocation;

public class AllocationResponse {
    private Integer sectionId;
    private String classCode;
    private String sectionCode;
    private String courseName;
    private Integer enrolledCount;
    private Integer maxCapacity; // THÊM DÒNG NÀY
    private String requiredRoomType;
    private String dayOfWeek;
    private Integer slotNumber;
    private String assignedRoom;
    private Integer roomCapacity;
    private String status;
    private Integer scheduleId;

    // Getters and Setters
    public Integer getSectionId() { return sectionId; }
    public void setSectionId(Integer sectionId) { this.sectionId = sectionId; }
    public String getClassCode() { return classCode; }
    public void setClassCode(String classCode) { this.classCode = classCode; }
    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
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
    public Integer getRoomCapacity() { return roomCapacity; }
    public void setRoomCapacity(Integer roomCapacity) { this.roomCapacity = roomCapacity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }
}
