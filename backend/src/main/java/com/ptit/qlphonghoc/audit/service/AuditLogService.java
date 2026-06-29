package com.ptit.qlphonghoc.audit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptit.qlphonghoc.audit.entity.AuditLog;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.repository.AuditLogRepository;
import com.ptit.qlphonghoc.admin.timetableimport.service.TimetableImportAuditLogger;
import com.ptit.qlphonghoc.user.entity.User;
import com.ptit.qlphonghoc.audit.dto.AuditLogDto;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import com.ptit.qlphonghoc.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class AuditLogService implements WorkflowAuditLogger, TimetableImportAuditLogger {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
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

    public PageResponse<AuditLogDto> getAuditLogs(
            Integer filterUserId,
            AuditAction action,
            String tableName,
            String search,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Integer page,
            Integer size
    ) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filterUserId != null) {
                predicates.add(cb.equal(root.get("userId"), filterUserId));
            }
            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (tableName != null && !tableName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("tableName")), "%" + tableName.toLowerCase() + "%"));
            }
            if (search != null && !search.isBlank()) {
                String likePattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("description")), likePattern),
                        cb.like(cb.lower(root.get("ipAddress")), likePattern),
                        cb.like(cb.lower(root.get("tableName")), likePattern)
                ));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // If pagination is not requested, fetch all matching logs
        if (page == null && size == null) {
            List<AuditLog> allLogs = auditLogRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
            List<AuditLogDto> dtos = enrichAuditLogs(allLogs);
            return new PageResponse<>(dtos, 0, dtos.size(), (long) dtos.size(), 1);
        }

        int pageVal = page == null ? 0 : page;
        int sizeVal = size == null ? 20 : size;
        Pageable pageable = PageRequest.of(pageVal, sizeVal, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> logPage = auditLogRepository.findAll(spec, pageable);

        List<AuditLogDto> dtos = enrichAuditLogs(logPage.getContent());

        return new PageResponse<>(
                dtos,
                logPage.getNumber(),
                logPage.getSize(),
                logPage.getTotalElements(),
                logPage.getTotalPages()
        );
    }

    private List<AuditLogDto> enrichAuditLogs(List<AuditLog> logs) {
        List<Integer> userIds = logs.stream()
                .map(AuditLog::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Integer, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(u -> userMap.put(u.getId(), u));
        }

        return logs.stream().map(log -> {
            User user = log.getUserId() != null ? userMap.get(log.getUserId()) : null;
            String username = user != null ? user.getUsername() : "System/Unknown";
            String role = user != null ? user.getRole().name() : "SYSTEM";
            return new AuditLogDto(
                    log.getId(),
                    log.getUserId(),
                    username,
                    role,
                    log.getAction(),
                    log.getTableName(),
                    log.getRecordId(),
                    log.getOldValues(),
                    log.getNewValues(),
                    log.getIpAddress(),
                    log.getDescription(),
                    log.getCreatedAt()
            );
        }).collect(Collectors.toList());
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
