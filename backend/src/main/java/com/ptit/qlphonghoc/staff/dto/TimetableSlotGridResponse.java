package com.ptit.qlphonghoc.staff.dto;

import java.util.Map;

public class TimetableSlotGridResponse {

    private Integer slot;
    private String periodText;

    private Map<String, TimetableCellResponse> days;

    public TimetableSlotGridResponse() {
    }

    public Integer getSlot() {
        return slot;
    }

    public void setSlot(Integer slot) {
        this.slot = slot;
    }

    public String getPeriodText() {
        return periodText;
    }

    public void setPeriodText(String periodText) {
        this.periodText = periodText;
    }

    public Map<String, TimetableCellResponse> getDays() {
        return days;
    }

    public void setDays(Map<String, TimetableCellResponse> days) {
        this.days = days;
    }
}