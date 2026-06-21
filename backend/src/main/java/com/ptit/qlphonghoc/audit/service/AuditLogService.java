package com.ptit.qlphonghoc.audit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptit.qlphonghoc.audit.entity.AuditLog;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.repository.AuditLogRepository;
import com.ptit.qlphonghoc.admin.timetableimport.service.TimetableImportAuditLogger;
import com.ptit.qlphonghoc.user.entity.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuditLogService implements WorkflowAuditLogger, TimetableImportAuditLogger {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    public void logLogin(User user, String ipAddress) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(user.getId());
        auditLog.setAction(AuditAction.LOGIN);
        auditLog.setTableName("users");
        auditLog.setRecordId(user.getId().longValue());
        auditLog.setIpAddress(ipAddress);
        auditLog.setNewValues(toJson(Map.of(
                "username", user.getUsername(),
                "role", user.getRole().name(),
                "loginAt", LocalDateTime.now().toString()
        )));
        auditLogRepository.save(auditLog);
    }

    @Override
    public void logWorkflowTransition(
            Integer userId,
            AuditAction action,
            Integer semesterId,
            String oldStatus,
            String newStatus,
            String description
    ) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setAction(action);
        auditLog.setTableName("semesters");
        auditLog.setRecordId(semesterId.longValue());
        auditLog.setOldValues(toJson(Map.of("timetableStatus", oldStatus)));
        auditLog.setNewValues(toJson(Map.of("timetableStatus", newStatus)));
        auditLog.setDescription(description);
        auditLogRepository.save(auditLog);
    }

    @Override
    public void logTimetableImport(
            Integer userId,
            Long semesterId,
            String importBatchCode,
            Map<String, Object> summary
    ) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setAction(AuditAction.UPDATE);
        auditLog.setTableName("class_sections");
        auditLog.setRecordId(semesterId);
        auditLog.setNewValues(toJson(summary));
        auditLog.setDescription("Apply timetable import batch " + importBatchCode);
        auditLogRepository.saveAndFlush(auditLog);
    }

    private String toJson(Map<String, Object> values) {
        try {
            return objectMapper.writeValueAsString(new LinkedHashMap<>(values));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize audit log payload", exception);
        }
    }
}
