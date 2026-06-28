package com.ptit.qlphonghoc.admin.service;

import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionRequest;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionRequest.SplitPart;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSectionResponse;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSuggestionRequest;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSuggestionResponse;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSuggestionResponse.SplitPartSuggestion;
import com.ptit.qlphonghoc.admin.dto.AdminSplitSuggestionResponse.SplitSuggestion;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.RoomRef;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.SlotRef;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.SlotRangeRef;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.SplitContext;
import com.ptit.qlphonghoc.admin.repository.AdminSectionSplitRepository.WeekBoundsRef;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AdminSectionSplitService {

    private static final Set<String> SPLITTABLE_STATUSES = Set.of(
            TimetableWorkflowStatus.DRAFT.name(),
            TimetableWorkflowStatus.CONFLICT.name()
    );
    private static final List<String> DAY_ORDER = List.of("MON", "TUE", "WED", "THU", "FRI", "SAT");
    private static final int MAX_SUGGESTIONS = 5;

    private final AdminSectionSplitRepository repository;
    private final WorkflowAuditLogger auditLogger;

    public AdminSectionSplitService(
            AdminSectionSplitRepository repository,
            WorkflowAuditLogger auditLogger
    ) {
        this.repository = repository;
        this.auditLogger = auditLogger;
    }

    @Transactional(readOnly = true)
    public AdminSplitSuggestionResponse suggest(
            Integer sectionId,
            AdminSplitSuggestionRequest request
    ) {
        SplitContext context = repository.findContext(sectionId, request.scheduleId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SCHEDULE_NOT_FOUND",
                        "Không tìm thấy lịch lớp học phần cần tách."
                ));
        String workflowStatus = context.timetableStatus().toUpperCase(Locale.ROOT);
        if (!SPLITTABLE_STATUSES.contains(workflowStatus)) {
            throw new BadRequestException(
                    "TIMETABLE_NOT_EDITABLE",
                    "Chỉ được tách lớp ở trạng thái NHÁP hoặc XUNG ĐỘT!"
            );
        }
        if (request.parts().size() != request.partCount()) {
            throw new BadRequestException("INVALID_SPLIT_PARTS", "Số nhóm và danh sách nhóm không khớp.");
        }

        List<SuggestionInput> inputs = normalizeSuggestionInputs(context, request);
        int totalStudents = inputs.stream().mapToInt(SuggestionInput::studentCount).sum();
        if (totalStudents != context.enrolledCount()) {
            throw new BadRequestException(
                    "INVALID_SPLIT_TOTAL",
                    "Tổng sỉ số các nhóm phải bằng sĩ số học phần gốc: " + context.enrolledCount() + "."
            );
        }

        List<String> failureReasons = validateSuggestionBase(context, inputs);
        if (!failureReasons.isEmpty()) {
            return new AdminSplitSuggestionResponse(List.of(), failureReasons, true);
        }

        int slotSpan = Math.max(1, inputs.get(0).slotEndNo() - inputs.get(0).slotStartNo() + 1);
        List<SlotRangeRef> slotRanges = repository.findSlotRanges(slotSpan);
        if (slotRanges.isEmpty()) {
            return new AdminSplitSuggestionResponse(
                    List.of(),
                    List.of(" Không tìm thấy khoảng tiết hợp lệ có độ dài " + slotSpan + " tiet."),
                    true
            );
        }

        List<CandidateTime> candidateTimes = buildCandidateTimes(slotRanges);
        List<SplitSuggestion> suggestions = new ArrayList<>();
        LinkedHashSet<String> rejectedReasons = new LinkedHashSet<>();
        int offsetLimit = Math.min(candidateTimes.size(), 24);

        for (int offset = 0; offset < offsetLimit && suggestions.size() < MAX_SUGGESTIONS; offset++) {
            List<SplitPartSuggestion> parts = buildSuggestionParts(
                    context,
                    request.scheduleId(),
                    inputs,
                    candidateTimes,
                    offset,
                    rejectedReasons
            );
            if (parts.size() == inputs.size()) {
                suggestions.add(new SplitSuggestion(
                        "SUGGESTION_" + (suggestions.size() + 1),
                        "Phuong an " + (suggestions.size() + 1),
                        parts
                ));
            }
        }

        List<String> reasons = rejectedReasons.isEmpty()
                ? List.of("Không tìm thấy ổ học phòng và thời gian thoả ràng buộc.")
                : List.copyOf(rejectedReasons);
        return new AdminSplitSuggestionResponse(suggestions, suggestions.isEmpty() ? reasons : List.of(), true);
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
        validateRoomAssignments(request.scheduleId(), context, parts);

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
                first.classroomId(),
                adminUserId,
                "Tách từ " + context.courseCode() + ".L" + context.sectionCode()
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
                    part.classroomId(),
                    adminUserId,
                    "Tách từ " + context.courseCode() + ".L" + context.sectionCode()
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

        boolean hasAssignedRooms = parts.stream().anyMatch(part -> part.classroomId() != null);
        return new AdminSplitSectionResponse(
                sectionId,
                createdSectionIds,
                updatedScheduleIds,
                TimetableWorkflowStatus.DRAFT.name(),
                hasAssignedRooms
                        ? "Đã tách lớp theo phương án đề xuất. Vui lòng kiểm tra xung đột lại."
                        : "Đã tách lớp. Các lịch mới đang chờ phân phòng."
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
                    end.number(),
                    part.classroomId()
            ));
        }
        return parts;
    }

    private List<SuggestionInput> normalizeSuggestionInputs(
            SplitContext context,
            AdminSplitSuggestionRequest request
    ) {
        List<SuggestionInput> inputs = new ArrayList<>();
        Set<String> requestCodes = new HashSet<>();
        for (int index = 0; index < request.parts().size(); index++) {
            AdminSplitSuggestionRequest.SuggestionPart part = request.parts().get(index);
            if (!repository.lecturerExists(part.lecturerId())) {
                throw new BadRequestException("LECTURER_NOT_FOUND", "Giảng viên của nhóm tách không tồn tại.");
            }
            String sectionCode = normalizeSectionCode(context.courseCode(), part.sectionCode());
            String codeKey = sectionCode.toUpperCase(Locale.ROOT);
            if (!requestCodes.add(codeKey)) {
                throw new BadRequestException("DUPLICATE_SECTION_CODE", "Mã nhóm " + sectionCode + " bị trùng.");
            }
            inputs.add(new SuggestionInput(
                    index,
                    sectionCode,
                    part.studentCount(),
                    part.lecturerId(),
                    context.slotStartNo(),
                    context.slotEndNo()
            ));
        }
        return inputs;
    }

    private List<String> validateSuggestionBase(SplitContext context, List<SuggestionInput> inputs) {
        List<String> reasons = new ArrayList<>();
        WeekBoundsRef bounds = repository.findWeekBounds(context.semesterId());
        if (hasInvalidWeekRange(context.fromWeekNo(), context.toWeekNo(), bounds)) {
            reasons.add("Khoảng tuàn của lịch gốc không hợp lệ.");
        }
        if (context.requiredRoomType() == null || context.requiredRoomType().isBlank()) {
            reasons.add("Loại phòng học bắt buộc chưa được xác định.");
        }
        if (context.slotStartNo() == null || context.slotEndNo() == null || context.slotEndNo() < context.slotStartNo()) {
            reasons.add("Khoảng tiết của lịch gốc không hợp lệ.");
        }
        for (SuggestionInput input : inputs) {
            if (input.studentCount() == null || input.studentCount() <= 0) {
                reasons.add("Sĩ số nhóm  " + input.sectionCode() + " phải lớn hơn 0.");
            }
        }
        return reasons.stream().distinct().toList();
    }

    private List<CandidateTime> buildCandidateTimes(List<SlotRangeRef> slotRanges) {
        List<CandidateTime> times = new ArrayList<>();
        for (String day : DAY_ORDER) {
            for (SlotRangeRef slot : slotRanges) {
                times.add(new CandidateTime(day, slot));
            }
        }
        return times;
    }

    private List<SplitPartSuggestion> buildSuggestionParts(
            SplitContext context,
            Integer originalScheduleId,
            List<SuggestionInput> inputs,
            List<CandidateTime> candidateTimes,
            int offset,
            LinkedHashSet<String> rejectedReasons
    ) {
        List<SplitPartSuggestion> parts = new ArrayList<>();
        List<PlacedPart> placed = new ArrayList<>();

        for (int inputIndex = 0; inputIndex < inputs.size(); inputIndex++) {
            SuggestionInput input = inputs.get(inputIndex);
            SplitPartSuggestion selected = null;
            for (int attempt = 0; attempt < candidateTimes.size(); attempt++) {
                CandidateTime candidate = candidateTimes.get((offset + inputIndex + attempt) % candidateTimes.size());
                if (repository.countCalendarBlockConflicts(
                        context.semesterId(),
                        candidate.dayOfWeek(),
                        context.fromWeekNo(),
                        context.toWeekNo()
                ) > 0) {
                    rejectedReasons.add("Một số khung giờ bị chặn bởi lịch học vụ");
                    continue;
                }
                if (repository.lecturerHasOverlap(
                        context.semesterId(),
                        input.lecturerId(),
                        candidate.dayOfWeek(),
                        candidate.slot().startId(),
                        candidate.slot().endId(),
                        context.fromWeekNo(),
                        context.toWeekNo(),
                        originalScheduleId
                ) || conflictsWithPlacedLecturer(input.lecturerId(), candidate, placed)) {
                    rejectedReasons.add("Một số khung giờ bị trùng với lịch giảng viên của nhóm khác.");
                    continue;
                }

                List<RoomRef> rooms = repository.findAvailableRooms(
                        context.semesterId(),
                        candidate.dayOfWeek(),
                        candidate.slot().startId(),
                        candidate.slot().endId(),
                        context.fromWeekNo(),
                        context.toWeekNo(),
                        originalScheduleId,
                        context.requiredRoomType(),
                        input.studentCount(),
                        List.of(),
                        3
                );
                if (rooms.isEmpty()) {
                    rejectedReasons.add("Không tìm thấy phòng học trống cho nhóm " + input.sectionCode() + " vào khung giờ " + dayLabel(candidate.dayOfWeek()) + " tiết " + candidate.slot().startNo() + "-" + candidate.slot().endNo() + ".");
                    continue;
                }
                RoomRef room = rooms.stream()
                        .filter(candidateRoom -> !conflictsWithPlacedRoom(candidateRoom.id(), candidate, placed))
                        .findFirst()
                        .orElse(null);
                if (room == null) {
                    rejectedReasons.add("Không tìm thấy phòng học trống cho nhóm " + input.sectionCode() + " vào khung giờ " + dayLabel(candidate.dayOfWeek()) + " tiết " + candidate.slot().startNo() + "-" + candidate.slot().endNo() + ".");
                    continue;
                }
                selected = new SplitPartSuggestion(
                        input.partIndex(),
                        input.sectionCode(),
                        input.studentCount(),
                        input.lecturerId(),
                        candidate.dayOfWeek(),
                        dayLabel(candidate.dayOfWeek()),
                        candidate.slot().startId(),
                        candidate.slot().endId(),
                        candidate.slot().startNo(),
                        candidate.slot().endNo(),
                        room.id(),
                        room.code(),
                        room.capacity(),
                        room.roomType()
                );
                placed.add(new PlacedPart(input.lecturerId(), room.id(), candidate));
                break;
            }
            if (selected == null) {
                return parts;
            }
            parts.add(selected);
        }
        return parts;
    }

    private boolean conflictsWithPlacedLecturer(Integer lecturerId, CandidateTime candidate, List<PlacedPart> placed) {
        for (PlacedPart part : placed) {
            CandidateTime other = part.time();
            if (lecturerId.equals(part.lecturerId())
                    && candidate.dayOfWeek().equals(other.dayOfWeek())
                    && candidate.slot().startNo() <= other.slot().endNo()
                    && other.slot().startNo() <= candidate.slot().endNo()) {
                return true;
            }
        }
        return false;
    }

    private boolean conflictsWithPlacedRoom(Integer roomId, CandidateTime candidate, List<PlacedPart> placed) {
        for (PlacedPart part : placed) {
            CandidateTime other = part.time();
            if (roomId.equals(part.roomId())
                    && candidate.dayOfWeek().equals(other.dayOfWeek())
                    && candidate.slot().startNo() <= other.slot().endNo()
                    && other.slot().startNo() <= candidate.slot().endNo()) {
                return true;
            }
        }
        return false;
    }

    private void validateRoomAssignments(
            Integer originalScheduleId,
            SplitContext context,
            List<NormalizedPart> parts
    ) {
        for (int index = 0; index < parts.size(); index++) {
            NormalizedPart part = parts.get(index);

            if (part.classroomId() == null) {
                continue;
            }
            RoomRef room = repository.findRoom(part.classroomId())
                    .orElseThrow(() -> new BadRequestException("CLASSROOM_NOT_FOUND", "Không tìm thấy phòng học " + part.classroomId() + "."));
            validateRoomForPart(context, part, room);
            if (repository.roomHasOverlap(
                    context.semesterId(),
                    part.classroomId(),
                    part.dayOfWeek(),
                    part.slotStartId(),
                    part.slotEndId(),
                    context.fromWeekNo(),
                    context.toWeekNo(),
                    originalScheduleId
            )) {
                throw new BadRequestException(
                        "ROOM_TIME_CONFLICT",
                        "Phòng " + room.code() + " bị trùng bới các nhóm tách."
                );
            }
            for (int otherIndex = index + 1; otherIndex < parts.size(); otherIndex++) {
                NormalizedPart other = parts.get(otherIndex);
                if (part.classroomId().equals(other.classroomId())
                        && part.dayOfWeek().equals(other.dayOfWeek())
                        && part.slotStartNo() <= other.slotEndNo()
                        && other.slotStartNo() <= part.slotEndNo()) {
                    throw new BadRequestException(
                            "ROOM_TIME_CONFLICT",
                            "Phòng " + room.code() + " bị trùng gữa các nhóm tách."
                    );
                }
            }
        }
    }

    private void validateRoomForPart(SplitContext context, NormalizedPart part, RoomRef room) {
        if (!Boolean.TRUE.equals(room.active()) || Boolean.TRUE.equals(room.deleted())) {
            throw new BadRequestException("ROOM_INACTIVE_OR_DELETED", "Phòng " + room.code() + " không còn hoạt động.");
        }
        if (context.requiredRoomType() != null
                && !context.requiredRoomType().isBlank()
                && !context.requiredRoomType().equalsIgnoreCase(room.roomType())) {
            throw new BadRequestException(
                    "ROOM_TYPE_MISMATCH",
                    "Nhóm " + part.sectionCode() + " yêu cầu " + context.requiredRoomType()
                            + " những phòng " + room.code() + " là " + room.roomType() + "."
            );
        }
        if (room.capacity() == null || room.capacity() < part.studentCount()) {
            throw new BadRequestException(
                    "CAPACITY_EXCEEDED",
                    "Phòng " + room.code() + " không đủ sức chứa cho nhóm " + part.sectionCode() + "."
            );
        }
    }

    private boolean hasInvalidWeekRange(Integer fromWeekNo, Integer toWeekNo, WeekBoundsRef bounds) {
        if (fromWeekNo == null && toWeekNo != null) return true;
        if (fromWeekNo != null && fromWeekNo <= 0) return true;
        if (toWeekNo != null && (toWeekNo <= 0 || fromWeekNo == null || toWeekNo < fromWeekNo)) return true;
        if (bounds == null || bounds.minWeekNo() == null || bounds.maxWeekNo() == null) return false;
        int effectiveFrom = fromWeekNo == null ? bounds.minWeekNo() : fromWeekNo;
        int effectiveTo = toWeekNo == null ? bounds.maxWeekNo() : toWeekNo;
        return effectiveFrom < bounds.minWeekNo() || effectiveTo > bounds.maxWeekNo();
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

    private String dayLabel(String dayOfWeek) {
        return switch (dayOfWeek) {
            case "MON" -> "Thu 2";
            case "TUE" -> "Thu 3";
            case "WED" -> "Thu 4";
            case "THU" -> "Thu 5";
            case "FRI" -> "Thu 6";
            case "SAT" -> "Thu 7";
            case "SUN" -> "Chu nhat";
            default -> dayOfWeek;
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
            Integer slotEndNo,
            Integer classroomId
    ) {
    }

    private record SuggestionInput(
            Integer partIndex,
            String sectionCode,
            Integer studentCount,
            Integer lecturerId,
            Integer slotStartNo,
            Integer slotEndNo
    ) {
    }

    private record CandidateTime(String dayOfWeek, SlotRangeRef slot) {
    }

    private record PlacedPart(Integer lecturerId, Integer roomId, CandidateTime time) {
    }
}
