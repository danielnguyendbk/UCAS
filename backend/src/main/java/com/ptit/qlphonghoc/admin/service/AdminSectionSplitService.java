package com.ptit.qlphonghoc.admin.service;

import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionRequest;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionRequest.SplitPart;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionResponse;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.SlotRef;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.SplitContext;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.audit.service.WorkflowAuditLogger;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AdminSectionSplitService {

    private static final Set<String> SPLITTABLE_STATUSES = Set.of(
            TimetableWorkflowStatus.DRAFT.name(),
            TimetableWorkflowStatus.CONFLICT.name()
    );

    private final AdminSectionSplitRepository repository;
    private final WorkflowAuditLogger auditLogger;

    public AdminSectionSplitService(
            AdminSectionSplitRepository repository,
            WorkflowAuditLogger auditLogger
    ) {
        this.repository = repository;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public AdminSplitSectionResponse split(
            Integer sectionId,
            AdminSplitSectionRequest request,
            Integer adminUserId
    ) {
        SplitContext context = repository.findContextForUpdate(sectionId, request.scheduleId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SCHEDULE_NOT_FOUND",
                        "Không tìm thấy lịch thuộc lớp học phần cần tách."
                ));
        String workflowStatus = context.timetableStatus().toUpperCase(Locale.ROOT);
        if (!SPLITTABLE_STATUSES.contains(workflowStatus)) {
            throw new BadRequestException(
                    "TIMETABLE_NOT_EDITABLE",
                    "Chỉ được tách lớp khi thời khóa biểu ở trạng thái DRAFT hoặc CONFLICT."
            );
        }
        if (Boolean.FALSE.equals(request.clearRoomAssignments())) {
            throw new BadRequestException(
                    "SPLIT_REQUIRES_ROOM_RESET",
                    "Các nhóm sau tách phải được đưa về trạng thái chờ phân phòng."
            );
        }

        List<NormalizedPart> parts = normalizeAndValidateParts(sectionId, request, context);
        int totalStudents = parts.stream().mapToInt(NormalizedPart::studentCount).sum();
        if (totalStudents != context.enrolledCount()) {
            throw new BadRequestException(
                    "INVALID_SPLIT_TOTAL",
                    "Tổng sĩ số các nhóm phải bằng sĩ số lớp học phần gốc: " + context.enrolledCount() + "."
            );
        }
        validateLecturerConflicts(request.scheduleId(), context, parts);

        NormalizedPart first = parts.get(0);
        if (repository.updateOriginalSection(
                sectionId,
                first.sectionCode(),
                first.studentCount(),
                first.lecturerId()
        ) != 1 || repository.updateOriginalSchedule(
                sectionId,
                request.scheduleId(),
                first.dayOfWeek(),
                first.slotStartId(),
                first.slotEndId(),
                "[SPLIT_PART] Tách từ " + context.courseCode() + ".L" + context.sectionCode()
        ) != 1) {
            throw new BadRequestException("SECTION_SPLIT_FAILED", "Không thể cập nhật nhóm đầu tiên sau tách.");
        }

        List<Integer> createdSectionIds = new ArrayList<>();
        List<Integer> updatedScheduleIds = new ArrayList<>();
        updatedScheduleIds.add(request.scheduleId());
        for (int index = 1; index < parts.size(); index++) {
            NormalizedPart part = parts.get(index);
            Integer createdSectionId = repository.insertSection(
                    context,
                    part.sectionCode(),
                    part.studentCount(),
                    part.lecturerId()
            );
            Integer createdScheduleId = repository.insertSchedule(
                    createdSectionId,
                    context,
                    part.dayOfWeek(),
                    part.slotStartId(),
                    part.slotEndId(),
                    "[SPLIT_PART] Tách từ " + context.courseCode() + ".L" + context.sectionCode()
            );
            createdSectionIds.add(createdSectionId);
            updatedScheduleIds.add(createdScheduleId);
        }

        if (repository.markSemesterDraft(context.semesterId()) != 1) {
            throw new BadRequestException("SECTION_SPLIT_FAILED", "Không thể đưa thời khóa biểu về bản nháp.");
        }
        auditLogger.logWorkflowTransition(
                adminUserId,
                AuditAction.UPDATE,
                context.semesterId(),
                workflowStatus,
                TimetableWorkflowStatus.DRAFT.name(),
                "Admin split class section due to capacity conflict."
        );

        return new AdminSplitSectionResponse(
                sectionId,
                createdSectionIds,
                updatedScheduleIds,
                TimetableWorkflowStatus.DRAFT.name(),
                "Đã tách lớp. Các lịch mới đang chờ phân phòng."
        );
    }

    private List<NormalizedPart> normalizeAndValidateParts(
            Integer sectionId,
            AdminSplitSectionRequest request,
            SplitContext context
    ) {
        List<NormalizedPart> parts = new ArrayList<>();
        Set<String> requestCodes = new HashSet<>();
        for (SplitPart part : request.parts()) {
            if (!repository.lecturerExists(part.lecturerId())) {
                throw new BadRequestException("LECTURER_NOT_FOUND", "Giảng viên của nhóm tách không tồn tại.");
            }
            String sectionCode = normalizeSectionCode(context.courseCode(), part.sectionCode());
            String codeKey = sectionCode.toUpperCase(Locale.ROOT);
            if (!requestCodes.add(codeKey)
                    || repository.sectionCodeExists(
                            context.semesterId(),
                            context.courseId(),
                            sectionCode,
                            sectionId
                    )) {
                throw new BadRequestException(
                        "DUPLICATE_SECTION_CODE",
                        "Mã nhóm " + sectionCode + " đã tồn tại trong môn học và học kỳ này."
                );
            }
            SlotRef start = repository.resolveSlot(part.slotStartId(), part.slotStartNo())
                    .orElseThrow(() -> new BadRequestException("INVALID_SLOT", "Không tìm thấy tiết bắt đầu."));
            SlotRef end = repository.resolveSlot(part.slotEndId(), part.slotEndNo())
                    .orElseThrow(() -> new BadRequestException("INVALID_SLOT", "Không tìm thấy tiết kết thúc."));
            if (end.number() < start.number()) {
                throw new BadRequestException("INVALID_SLOT_RANGE", "Tiết kết thúc phải từ tiết bắt đầu trở đi.");
            }
            parts.add(new NormalizedPart(
                    sectionCode,
                    part.studentCount(),
                    part.lecturerId(),
                    normalizeDay(part.dayOfWeek()),
                    start.id(),
                    end.id(),
                    start.number(),
                    end.number()
            ));
        }
        return parts;
    }

    private void validateLecturerConflicts(
            Integer originalScheduleId,
            SplitContext context,
            List<NormalizedPart> parts
    ) {
        for (int index = 0; index < parts.size(); index++) {
            NormalizedPart part = parts.get(index);
            if (repository.lecturerHasOverlap(
                    context.semesterId(),
                    part.lecturerId(),
                    part.dayOfWeek(),
                    part.slotStartId(),
                    part.slotEndId(),
                    context.fromWeekNo(),
                    context.toWeekNo(),
                    originalScheduleId
            )) {
                throw lecturerConflict(part.sectionCode());
            }
            for (int otherIndex = index + 1; otherIndex < parts.size(); otherIndex++) {
                NormalizedPart other = parts.get(otherIndex);
                if (part.lecturerId().equals(other.lecturerId())
                        && part.dayOfWeek().equals(other.dayOfWeek())
                        && part.slotStartNo() <= other.slotEndNo()
                        && other.slotStartNo() <= part.slotEndNo()) {
                    throw lecturerConflict(other.sectionCode());
                }
            }
        }
    }

    private BadRequestException lecturerConflict(String sectionCode) {
        return new BadRequestException(
                "LECTURER_TIME_CONFLICT",
                "Giảng viên của nhóm " + sectionCode + " bị trùng lịch. Hãy đổi giảng viên hoặc thời gian học."
        );
    }

    private String normalizeSectionCode(String courseCode, String rawCode) {
        String value = rawCode.trim();
        String fullPrefix = courseCode + ".L";
        if (value.regionMatches(true, 0, fullPrefix, 0, fullPrefix.length())) {
            value = value.substring(fullPrefix.length());
        }
        if (value.isBlank() || value.length() > 20) {
            throw new BadRequestException(
                    "INVALID_SECTION_CODE",
                    "Mã nhóm sau tách phải có từ 1 đến 20 ký tự (không tính tiền tố mã môn)."
            );
        }
        return value;
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

    private record NormalizedPart(
            String sectionCode,
            Integer studentCount,
            Integer lecturerId,
            String dayOfWeek,
            Integer slotStartId,
            Integer slotEndId,
            Integer slotStartNo,
            Integer slotEndNo
    ) {
    }
}
