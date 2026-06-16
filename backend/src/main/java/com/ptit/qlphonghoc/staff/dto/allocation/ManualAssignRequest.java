package com.ptit.qlphonghoc.staff.dto.allocation;

public class ManualAssignRequest {
    private Integer scheduleId;
    private Integer classroomId;

    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }
    public Integer getClassroomId() { return classroomId; }
    public void setClassroomId(Integer classroomId) { this.classroomId = classroomId; }
}