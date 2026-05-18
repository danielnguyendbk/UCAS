package com.ptit.qlphonghoc.lecturer.dto.roomborrow;

public class LecturerAvailableRoomResponse {

    private Integer classroomId;
    private String roomCode;
    private Integer capacity;
    private String roomType;
    private String roomTypeText;
    private String mainEquipment;
    private String statusText;

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
}
