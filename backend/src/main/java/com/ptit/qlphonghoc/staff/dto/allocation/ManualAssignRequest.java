package com.ptit.qlphonghoc.staff.dto.allocation;

import jakarta.validation.constraints.NotNull;

public class ManualAssignRequest {
    @NotNull(message = "scheduleId is required")
    private Integer scheduleId;

    @NotNull(message = "classroomId is required")
    private Integer classroomId;

    public Integer getScheduleId() { return scheduleId; }
    public void setScheduleId(Integer scheduleId) { this.scheduleId = scheduleId; }
    public Integer getClassroomId() { return classroomId; }
    public void setClassroomId(Integer classroomId) { this.classroomId = classroomId; }
}
