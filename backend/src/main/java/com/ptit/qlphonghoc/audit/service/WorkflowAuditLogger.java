package com.ptit.qlphonghoc.audit.service;

import com.ptit.qlphonghoc.audit.enumtype.AuditAction;

public interface WorkflowAuditLogger {

    void logWorkflowTransition(
            Integer userId,
            AuditAction action,
            Integer semesterId,
            String oldStatus,
            String newStatus,
            String description
    );
}
