package com.ptit.qlphonghoc.timetableworkflow.service;

import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.service.WorkflowAuditLogger;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.staff.dto.allocation.AllocationValidationSummary;
import com.ptit.qlphonghoc.staff.service.AllocationValidationService;
import com.ptit.qlphonghoc.classsession.service.ClassSessionGenerator;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import com.ptit.qlphonghoc.timetableworkflow.dto.TimetableWorkflowSummary;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowRepository.SemesterWorkflowState;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowRepository.ValidationCounts;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
public class TimetableWorkflowService {

    private static final Set<TimetableWorkflowStatus> SUBMITTABLE_STATUSES = Set.of(
            TimetableWorkflowStatus.DRAFT,
            TimetableWorkflowStatus.CONFLICT
    );

    private final TimetableWorkflowStore repository;
    private final AllocationValidationService allocationService;
    private final WorkflowAuditLogger auditLogService;
    private final ClassSessionGenerator classSessionGenerator;

    public TimetableWorkflowService(
            TimetableWorkflowStore repository,
            AllocationValidationService allocationService,
            WorkflowAuditLogger auditLogService,
            ClassSessionGenerator classSessionGenerator
    ) {
        this.repository = repository;
        this.allocationService = allocationService;
        this.auditLogService = auditLogService;
        this.classSessionGenerator = classSessionGenerator;
    }

    @Transactional(readOnly = true)
    public TimetableWorkflowSummary getStatus(Integer semesterId) {
        SemesterWorkflowState semester = findSemester(semesterId, false);
        return buildStoredSummary(semester);
    }

    @Transactional
    public TimetableWorkflowSummary submit(Integer semesterId, Integer staffUserId) {
        SemesterWorkflowState semester = findSemester(semesterId, true);
        assertNotFinalized(semester.status());
        if (!SUBMITTABLE_STATUSES.contains(semester.status())) {
            throw invalidTransition("submit", semester.status(), "DRAFT or CONFLICT");
        }

        updateStatus(semesterId, TimetableWorkflowStatus.VALIDATING);
        AllocationValidationSummary validation = allocationService.validateAllocations(semesterId);
        if (hasBlockingIssues(validation)) {
            updateStatus(semesterId, TimetableWorkflowStatus.CONFLICT);
            return fromValidation(
                    semester.withStatus(TimetableWorkflowStatus.CONFLICT),
                    validation
            );
        }

        updateStatus(semesterId, TimetableWorkflowStatus.READY_FOR_APPROVAL);
        auditLogService.logWorkflowTransition(
                staffUserId,
                AuditAction.REQUEST,
                semesterId,
                semester.status().name(),
                TimetableWorkflowStatus.READY_FOR_APPROVAL.name(),
                "Staff submitted timetable for approval"
        );
        return fromValidation(
                semester.withStatus(TimetableWorkflowStatus.READY_FOR_APPROVAL),
                validation
        );
    }

    @Transactional
    public TimetableWorkflowSummary approve(Integer semesterId, Integer adminUserId) {
        SemesterWorkflowState semester = findSemester(semesterId, true);
        assertNotFinalized(semester.status());
        if (semester.status() != TimetableWorkflowStatus.READY_FOR_APPROVAL) {
            throw invalidTransition("approve", semester.status(), "READY_FOR_APPROVAL");
        }

        updateStatus(semesterId, TimetableWorkflowStatus.APPROVED);
        auditLogService.logWorkflowTransition(
                adminUserId,
                AuditAction.APPROVE,
                semesterId,
                semester.status().name(),
                TimetableWorkflowStatus.APPROVED.name(),
                "Admin approved timetable"
        );
        return buildStoredSummary(semester.withStatus(TimetableWorkflowStatus.APPROVED));
    }

    @Transactional
    public TimetableWorkflowSummary publish(Integer semesterId, Integer adminUserId) {
        SemesterWorkflowState semester = findSemester(semesterId, true);
        assertNotFinalized(semester.status());
        if (semester.status() != TimetableWorkflowStatus.APPROVED) {
            throw invalidTransition("publish", semester.status(), "APPROVED");
        }

        AllocationValidationSummary validation = allocationService.validateAllocations(semesterId);
        if (hasBlockingIssues(validation)) {
            updateStatus(semesterId, TimetableWorkflowStatus.CONFLICT);
            return fromValidation(
                    semester.withStatus(TimetableWorkflowStatus.CONFLICT),
                    validation
            );
        }

        updateStatus(semesterId, TimetableWorkflowStatus.PUBLISHED);
        classSessionGenerator.generateClassSessions(semesterId);
        auditLogService.logWorkflowTransition(
                adminUserId,
                AuditAction.UPDATE,
                semesterId,
                semester.status().name(),
                TimetableWorkflowStatus.PUBLISHED.name(),
                "Admin published timetable"
        );
        return fromValidation(
                semester.withStatus(TimetableWorkflowStatus.PUBLISHED),
                validation
        );
    }

    @Transactional
    public TimetableWorkflowSummary lock(Integer semesterId, Integer adminUserId) {
        SemesterWorkflowState semester = findSemester(semesterId, true);
        if (semester.status() == TimetableWorkflowStatus.LOCKED) {
            throw new BadRequestException(
                    TimetableMutationGuard.LOCKED_ERROR_CODE,
                    TimetableMutationGuard.LOCKED_MESSAGE
            );
        }
        if (semester.status() != TimetableWorkflowStatus.PUBLISHED) {
            throw invalidTransition("lock", semester.status(), "PUBLISHED");
        }

        updateStatus(semesterId, TimetableWorkflowStatus.LOCKED);
        auditLogService.logWorkflowTransition(
                adminUserId,
                AuditAction.UPDATE,
                semesterId,
                semester.status().name(),
                TimetableWorkflowStatus.LOCKED.name(),
                "Admin locked timetable"
        );
        return buildStoredSummary(semester.withStatus(TimetableWorkflowStatus.LOCKED));
    }

    private boolean hasBlockingIssues(AllocationValidationSummary validation) {
        return validation.totalSchedules() == 0 || validation.conflictCount() > 0;
    }

    private TimetableWorkflowSummary fromValidation(
            SemesterWorkflowState semester,
            AllocationValidationSummary validation
    ) {
        Map<String, Integer> conflictTypeCounts = new LinkedHashMap<>(validation.conflictTypeCounts());
        if (validation.totalSchedules() == 0) {
            conflictTypeCounts.put("NO_SCHEDULES", 1);
        }
        return new TimetableWorkflowSummary(
                semester.semesterId(),
                semester.semesterName(),
                semester.status().name(),
                validation.totalSchedules(),
                validation.validCount(),
                validation.conflictCount(),
                conflictTypeCounts
        );
    }

    private TimetableWorkflowSummary buildStoredSummary(SemesterWorkflowState semester) {
        ValidationCounts counts = repository.findValidationCounts(semester.semesterId());
        return new TimetableWorkflowSummary(
                semester.semesterId(),
                semester.semesterName(),
                semester.status().name(),
                counts.totalSchedules(),
                counts.validCount(),
                counts.conflictCount(),
                Map.of()
        );
    }

    private SemesterWorkflowState findSemester(Integer semesterId, boolean forUpdate) {
        return repository.findSemester(semesterId, forUpdate)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SEMESTER_NOT_FOUND",
                        "Không tìm thấy học kỳ."
                ));
    }

    private void updateStatus(Integer semesterId, TimetableWorkflowStatus status) {
        if (repository.updateStatus(semesterId, status) != 1) {
            throw new BadRequestException(
                    "INVALID_TIMETABLE_STATUS",
                    "Không thể cập nhật trạng thái thời khóa biểu."
            );
        }
    }

    private void assertNotFinalized(TimetableWorkflowStatus status) {
        if (status == TimetableWorkflowStatus.PUBLISHED) {
            throw new BadRequestException(
                    TimetableMutationGuard.PUBLISHED_ERROR_CODE,
                    TimetableMutationGuard.PUBLISHED_MESSAGE
            );
        }
        if (status == TimetableWorkflowStatus.LOCKED) {
            throw new BadRequestException(
                    TimetableMutationGuard.LOCKED_ERROR_CODE,
                    TimetableMutationGuard.LOCKED_MESSAGE
            );
        }
    }

    private BadRequestException invalidTransition(
            String action,
            TimetableWorkflowStatus currentStatus,
            String requiredStatus
    ) {
        return new BadRequestException(
                "INVALID_TIMETABLE_STATUS",
                "Không thể " + action + " thời khóa biểu khi trạng thái là " + currentStatus
                        + ". Trạng thái yêu cầu: " + requiredStatus + "."
        );
    }
}
