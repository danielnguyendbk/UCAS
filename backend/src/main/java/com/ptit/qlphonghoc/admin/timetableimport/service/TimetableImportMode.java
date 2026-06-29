package com.ptit.qlphonghoc.admin.timetableimport.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;

import java.util.Locale;

public enum TimetableImportMode {
    MERGE_ONLY,
    SYNC_FILE_SCOPE;

    public static TimetableImportMode from(String value) {
        if (value == null || value.isBlank()) return MERGE_ONLY;
        try {
            return TimetableImportMode.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "INVALID_IMPORT_MODE",
                    "Chế độ import không hợp lệ. Chỉ hỗ trợ MERGE_ONLY hoặc SYNC_FILE_SCOPE."
            );
        }
    }
}
