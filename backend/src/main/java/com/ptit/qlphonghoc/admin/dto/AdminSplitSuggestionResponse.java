package com.ptit.qlphonghoc.admin.dto;

import java.util.List;

public record AdminSplitSuggestionResponse(
        List<SplitSuggestion> suggestions,
        List<String> failureReasons,
        boolean canCreateUnassigned
) {

    public record SplitSuggestion(
            String suggestionId,
            String label,
            List<SplitPartSuggestion> parts
    ) {
    }

    public record SplitPartSuggestion(
            Integer partIndex,
            String sectionCode,
            Integer studentCount,
            Integer lecturerId,
            String lecturerCode,
            String lecturerName,
            String dayOfWeek,
            String dayLabel,
            Integer slotStartId,
            Integer slotEndId,
            Integer slotStartNo,
            Integer slotEndNo,
            Integer classroomId,
            String roomCode,
            Integer roomCapacity,
            String roomType
    ) {
    }
}