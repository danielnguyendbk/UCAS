package com.ptit.qlphonghoc.timetableworkflow.entity;

import java.time.LocalDateTime;

public record TimetableVersion(
        Long versionId,
        Long semesterId,
        String semesterCode,
        String semesterName,
        Integer versionNo,
        Integer createdBy,
        String createdByName,
        LocalDateTime createdAt,
        String summary
) {}
