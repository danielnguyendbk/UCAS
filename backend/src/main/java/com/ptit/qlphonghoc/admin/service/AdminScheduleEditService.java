package com.ptit.qlphonghoc.admin.service;

import com.ptit.qlphonghoc.admin.dto.AdminScheduleUpdateRequest;
import com.ptit.qlphonghoc.admin.repository.AdminScheduleEditRepository;
import com.ptit.qlphonghoc.admin.repository.AdminScheduleEditRepository.ScheduleEditContext;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.service.WorkflowAuditLogger;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.service.ClassSectionTableReader;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

@Service
public class AdminScheduleEditService {

    private static final Set<String> EDITABLE_STATUSES = Set.of(
            TimetableWorkflowStatus.DRAFT.name(),
            TimetableWorkflowStatus.CONFLICT.name()
    );

    private final AdminScheduleEditRepository repository;
    private final ClassSectionTableReader classSectionReader;
    private final WorkflowAuditLogger auditLogger;

    public AdminScheduleEditService(
            AdminScheduleEditRepository repository,
            ClassSectionTableReader classSectionReader,
            WorkflowAuditLogger auditLogger
    ) {
        this.repository = repository;
        this.classSectionReader = classSectionReader;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public StaffSectionTableResponse update(
            Integer sectionId,
            Integer scheduleId,
            AdminScheduleUpdateRequest request,
            Integer adminUserId
    ) {
        ScheduleEditContext context = repository.findContextForUpdate(sectionId, scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SCHEDULE_NOT_FOUND",
                        "Không tìm thấy lịch thuộc lớp học phần đã chọn."
                ));

        String currentStatus = context.timetableStatus().toUpperCase(Locale.ROOT);
        if (!EDITABLE_STATUSES.contains(currentStatus)) {
            throw new BadRequestException(
                    "TIMETABLE_NOT_EDITABLE",
                    "Chỉ được sửa lịch khi thời khóa biểu ở trạng thái DRAFT hoặc CONFLICT."
            );
        }
        if (request.lecturerId() != null && !repository.lecturerExists(request.lecturerId())) {
            throw new BadRequestException("LECTURER_NOT_FOUND", "Giảng viên không tồn tại hoặc đã bị xóa.");
        }
        if (request.classroomId() != null && !repository.classroomIsActive(request.classroomId())) {
            throw new BadRequestException("CLASSROOM_NOT_AVAILABLE", "Phòng học không tồn tại hoặc không hoạt động.");
        }
        if (!repository.slotRangeIsValid(request.slotStartId(), request.slotEndId())) {
            throw new BadRequestException("INVALID_SLOT_RANGE", "Tiết kết thúc phải từ tiết bắt đầu trở đi.");
        }
        if (request.fromWeekNo() > request.toWeekNo()) {
            throw new BadRequestException("INVALID_WEEK_RANGE", "Tuần kết thúc phải từ tuần bắt đầu trở đi.");
        }
        if (request.maxCapacity() != null && request.maxCapacity() < context.enrolledCount()) {
            throw new BadRequestException(
                    "INVALID_MAX_CAPACITY",
                    "Sức chứa lớp học phần không được nhỏ hơn số sinh viên đã đăng ký."
            );
        }

        repository.updateSection(sectionId, request.lecturerId(), request.maxCapacity());
        String note = request.note() == null || request.note().isBlank() ? null : request.note().trim();
        int updated = repository.updateSchedule(
                sectionId,
                scheduleId,
                request,
                normalizeDay(request.dayOfWeek()),
                adminUserId,
                note
        );
        if (updated != 1) {
            throw new BadRequestException("SCHEDULE_UPDATE_FAILED", "Không thể cập nhật lịch đã chọn.");
        }
        repository.markSemesterDraft(context.semesterId());
        auditLogger.logWorkflowTransition(
                adminUserId,
                AuditAction.UPDATE,
                context.semesterId(),
                currentStatus,
                TimetableWorkflowStatus.DRAFT.name(),
                "Admin updated reopened timetable schedule " + scheduleId
        );
        return classSectionReader.getById(sectionId);
    }

    private String normalizeDay(String rawDay) {
        String value = Normalizer.normalize(rawDay, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
        return switch (value) {
            case "MON", "MONDAY", "T2", "THU 2", "2" -> "MON";
            case "TUE", "TUESDAY", "T3", "THU 3", "3" -> "TUE";
            case "WED", "WEDNESDAY", "T4", "THU 4", "4" -> "WED";
            case "THU", "THURSDAY", "T5", "THU 5", "5" -> "THU";
            case "FRI", "FRIDAY", "T6", "THU 6", "6" -> "FRI";
            case "SAT", "SATURDAY", "T7", "THU 7", "7" -> "SAT";
            case "SUN", "SUNDAY", "CN", "CHU NHAT" -> "SUN";
            default -> throw new BadRequestException("INVALID_DAY", "Thứ học không hợp lệ.");
        };
    }
}
