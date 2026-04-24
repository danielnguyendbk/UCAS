package com.ptit.qlphonghoc.auth.dto;

public record StudentProfileResponse(
        Integer studentId,
        String studentCode,
        Integer facultyId,
        String className,
        Short courseYear,
        String phone
) {
}
