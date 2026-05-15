package com.ptit.qlphonghoc.staff.dto.allocation;

public class ConflictResponse {
    private String conflictType; // UNASSIGNED, CAPACITY_EXCEEDED, LECTURER_CONFLICT
    private String severity; // HIGH, MEDIUM, LOW
    private String dayOfWeek;
    private Integer slotNumber;
    private String roomCode;
    private String description;
    private String sectionCode;
    private String courseName;
    private String conflictingWith;

    // Getters and Setters
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
    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public String getConflictingWith() { return conflictingWith; }
    public void setConflictingWith(String conflictingWith) { this.conflictingWith = conflictingWith; }
}