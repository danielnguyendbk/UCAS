package com.ptit.qlphonghoc.staff.dto;

import java.util.List;

public class TimetableRoomGridResponse {

    private Integer classroomId;
    private String room;
    private String buildingCode;

    private List<TimetableSlotGridResponse> slots;

    public TimetableRoomGridResponse() {
    }

    public Integer getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Integer classroomId) {
        this.classroomId = classroomId;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getBuildingCode() {
        return buildingCode;
    }

    public void setBuildingCode(String buildingCode) {
        this.buildingCode = buildingCode;
    }

    public List<TimetableSlotGridResponse> getSlots() {
        return slots;
    }

    public void setSlots(List<TimetableSlotGridResponse> slots) {
        this.slots = slots;
    }
}