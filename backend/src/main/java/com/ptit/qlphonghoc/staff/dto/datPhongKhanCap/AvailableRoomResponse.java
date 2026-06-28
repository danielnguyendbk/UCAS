package com.ptit.qlphonghoc.staff.dto.datPhongKhanCap;

public class AvailableRoomResponse {

    private Integer classroomId;
    private String roomCode;
    private Integer capacity;
    private String roomType;
    private String roomTypeText;
    private String mainEquipment;
    private String statusText;
    private Integer slotStartNo;
    private Integer slotEndNo;
    private String startTime;
    private String endTime;

    public AvailableRoomResponse() {
    }

    public Integer getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Integer classroomId) {
        this.classroomId = classroomId;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getRoomTypeText() {
        return roomTypeText;
    }

    public void setRoomTypeText(String roomTypeText) {
        this.roomTypeText = roomTypeText;
    }

    public String getMainEquipment() {
        return mainEquipment;
    }

    public void setMainEquipment(String mainEquipment) {
        this.mainEquipment = mainEquipment;
    }

    public String getStatusText() {
        return statusText;
    }

    public void setStatusText(String statusText) {
        this.statusText = statusText;
    }

    public Integer getSlotStartNo() {
        return slotStartNo;
    }

    public void setSlotStartNo(Integer slotStartNo) {
        this.slotStartNo = slotStartNo;
    }

    public Integer getSlotEndNo() {
        return slotEndNo;
    }

    public void setSlotEndNo(Integer slotEndNo) {
        this.slotEndNo = slotEndNo;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }
}