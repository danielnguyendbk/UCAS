package com.ptit.qlphonghoc.audit.dto;

import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import java.time.LocalDateTime;

public record AuditLogDto(
        Long id,
        Integer userId,
        String username,
        String userRole,
        AuditAction action,
        String tableName,
        Long recordId,
        String oldValues,
        String newValues,
        String ipAddress,
        String description,
        LocalDateTime createdAt
) {}
