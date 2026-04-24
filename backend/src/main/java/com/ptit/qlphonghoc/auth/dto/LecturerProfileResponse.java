package com.ptit.qlphonghoc.auth.dto;

public record LecturerProfileResponse(
        Integer lecturerId,
        String staffCode,
        Integer departmentId,
        String fullName,
        String email,
        String phone
) {
}
