package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.staff.dto.allocation.AllocationResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.AllocationValidationSummary;
import com.ptit.qlphonghoc.staff.dto.allocation.ConflictResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ManualAssignRequest;
import com.ptit.qlphonghoc.staff.repository.StaffAllocationRepository;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableMutationPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StaffAllocationService implements AllocationValidationService {

    private static final int DEFAULT_FIRST_WEEK = 1;
    private static final int DEFAULT_LAST_WEEK = 999;

    private static final Map<String, Integer> CONFLICT_PRIORITY = Map.of(
            "INVALID_TIME_RANGE", 1,
            "INVALID_WEEK_RANGE", 2,
            "ROOM_INACTIVE_OR_DELETED", 3,
            "ROOM_TYPE_MISMATCH", 4,
            "CAPACITY_EXCEEDED", 5,
            "ROOM_TIME_CONFLICT", 6,
            "LECTURER_TIME_CONFLICT", 7,
            "UNASSIGNED", 8
    );

    private final StaffAllocationRepository repository;
    private final TimetableMutationPolicy mutationPolicy;

    public StaffAllocationService(
            StaffAllocationRepository repository,
            TimetableMutationPolicy mutationPolicy
    ) {
        this.repository = repository;
        this.mutationPolicy = mutationPolicy;
    }

    @Transactional(readOnly = true)
    public List<AllocationResponse> getAllocations(Integer semesterId) {
        return getAllocations(semesterId, null, null);
    }

    @Transactional(readOnly = true)
    public List<AllocationResponse> getAllocations(Integer semesterId, String search, String status) {
        return repository.findAllSchedulesBySemester(semesterId)
                .stream()
                .map(this::toAllocationResponse)
                .filter(allocation -> matchesAllocationSearch(allocation, search))
                .filter(allocation -> isBlank(status)
                        || status.equalsIgnoreCase(allocation.getAllocationStatus())
                        || status.equalsIgnoreCase(allocation.getStatus()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConflictResponse> getConflicts(Integer semesterId) {
        return getConflicts(semesterId, null, null);
    }

    @Transactional(readOnly = true)
    public List<ConflictResponse> getConflicts(Integer semesterId, String search, String conflictType) {
        return calculateConflicts(semesterId).conflicts().stream()
                .filter(conflict -> matchesConflictSearch(conflict, search))
                .filter(conflict -> isBlank(conflictType)
                        || conflictType.equalsIgnoreCase(conflict.getConflictType()))
                .toList();
    }

    @Transactional
    @Override
    public AllocationValidationSummary validateAllocations(Integer semesterId) {
        mutationPolicy.assertOriginalTimetableMutable(semesterId);
        ConflictCalculation calculation = calculateConflicts(semesterId);
        updateValidationStatuses(semesterId, calculation.conflicts());

        Set<Integer> conflictedScheduleIds = calculation.conflicts().stream()
                .map(ConflictResponse::getScheduleId)
                .collect(Collectors.toSet());
        Map<String, Integer> conflictTypeCounts = new LinkedHashMap<>();
        calculation.conflicts().forEach(conflict ->
                conflictTypeCounts.merge(conflict.getConflictType(), 1, Integer::sum));

        int totalSchedules = calculation.schedules().size();
        int conflictCount = conflictedScheduleIds.size();
        return new AllocationValidationSummary(
                totalSchedules,
                totalSchedules - conflictCount,
                conflictCount,
                conflictTypeCounts
        );
    }

    private ConflictCalculation calculateConflicts(Integer semesterId) {
        List<StaffAllocationRepository.AllocationProjection> schedules =
                repository.findAllSchedulesBySemester(semesterId);
        StaffAllocationRepository.WeekBoundsProjection bounds = repository.findWeekBounds(semesterId);

        Map<Integer, List<StaffAllocationRepository.CalendarBlockConflictProjection>> calendarConflicts =
                repository.findCalendarBlockConflicts(semesterId)
                        .stream()
                        .collect(Collectors.groupingBy(
                                StaffAllocationRepository.CalendarBlockConflictProjection::getScheduleId,
                                LinkedHashMap::new,
                                Collectors.toList()
                        ));

        List<ConflictResponse> conflicts = new ArrayList<>();

        for (StaffAllocationRepository.AllocationProjection schedule : schedules) {
            addSingleScheduleConflicts(conflicts, schedule, bounds, calendarConflicts.get(schedule.getScheduleId()));
        }

        addGroupedPairConflicts(conflicts, schedules, bounds);

        conflicts.sort(
                Comparator.comparing(ConflictResponse::getScheduleId)
                        .thenComparingInt(conflict -> priorityOf(conflict.getConflictType()))
        );

        return new ConflictCalculation(schedules, conflicts);
    }

    @Transactional
    public void manualAssign(ManualAssignRequest request, Integer staffUserId) {
        Integer scheduleId = request.getScheduleId();
        Integer classroomId = request.getClassroomId();

        repository.lockSchedule(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SCHEDULE_NOT_FOUND",
                        "Không tìm thấy lịch học."
                ));

        StaffAllocationRepository.AssignmentScheduleProjection schedule =
                repository.findScheduleForAssignment(scheduleId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "SCHEDULE_NOT_FOUND",
                                "Không tìm thấy lịch học."
                        ));

        validateAssignableSchedule(schedule);
        mutationPolicy.assertOriginalTimetableMutable(schedule.getSemesterId());

        repository.lockClassroom(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CLASSROOM_NOT_FOUND",
                        "Không tìm thấy phòng học."
                ));

        StaffAllocationRepository.AssignmentRoomProjection room =
                repository.findRoomForAssignment(classroomId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "CLASSROOM_NOT_FOUND",
                                "Không tìm thấy phòng học."
                        ));

        validateRoomForSchedule(room, schedule);

        int roomConflicts = repository.countRoomTimeConflicts(
                scheduleId,
                classroomId,
                schedule.getSemesterId(),
                schedule.getDayOfWeekCode(),
                schedule.getSlotStartId(),
                schedule.getSlotEndId(),
                schedule.getFromWeekNo(),
                schedule.getToWeekNo()
        );
        if (roomConflicts > 0) {
            throw new BadRequestException(
                    "ROOM_TIME_CONFLICT",
                    "Phòng " + room.getRoomCode() + " đã có lịch trùng tiết và khoảng tuần."
            );
        }



        int updated = repository.upsertRoomAllocation(scheduleId, classroomId, staffUserId);
        if (updated != 1) {
            throw new BadRequestException(
                    "ALLOCATION_CONFLICT",
                    "Lịch học không còn có thể phân phòng. Vui lòng tải lại dữ liệu."
            );
        }

    }

    @Transactional
    public void saveScheduleNote(Integer scheduleId, String note) {
        repository.lockSchedule(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SCHEDULE_NOT_FOUND",
                        "Không tìm thấy lịch học."
                ));
        StaffAllocationRepository.AssignmentScheduleProjection schedule =
                repository.findScheduleForAssignment(scheduleId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "SCHEDULE_NOT_FOUND",
                                "Không tìm thấy lịch học."
                        ));
        mutationPolicy.assertOriginalTimetableMutable(schedule.getSemesterId());
        if (repository.updateScheduleNote(scheduleId, note.trim()) != 1) {
            throw new BadRequestException("SCHEDULE_NOTE_FAILED", "Không thể lưu ghi chú cho lịch học.");
        }
    }

    @Transactional
    public String autoAssign(Integer semesterId, Integer staffUserId) {
        mutationPolicy.assertOriginalTimetableMutable(semesterId);
        List<Integer> unassignedIds = repository.findUnassignedScheduleIds(semesterId);
        int successCount = 0;

        for (Integer scheduleId : unassignedIds) {
            if (repository.lockSchedule(scheduleId).isEmpty()) {
                continue;
            }

            Optional<StaffAllocationRepository.AssignmentScheduleProjection> scheduleResult =
                    repository.findScheduleForAssignment(scheduleId);
            if (scheduleResult.isEmpty()) {
                continue;
            }

            StaffAllocationRepository.AssignmentScheduleProjection schedule = scheduleResult.get();
            if (!isAutoAssignable(schedule)) {
                continue;
            }

            int requiredCapacity = requiredCapacity(schedule.getEnrolledCount(), schedule.getMaxCapacity());
            Optional<Integer> availableRoomId = repository.findAvailableRoomForAutoAssign(
                    semesterId,
                    schedule.getDayOfWeekCode(),
                    schedule.getSlotStartId(),
                    schedule.getSlotEndId(),
                    schedule.getFromWeekNo(),
                    schedule.getToWeekNo(),
                    scheduleId,
                    schedule.getRequiredRoomType(),
                    requiredCapacity
            );

            if (availableRoomId.isEmpty()) {
                continue;
            }

            Integer classroomId = availableRoomId.get();
            if (repository.lockClassroom(classroomId).isEmpty()) {
                continue;
            }

            int roomConflicts = repository.countRoomTimeConflicts(
                    scheduleId,
                    classroomId,
                    semesterId,
                    schedule.getDayOfWeekCode(),
                    schedule.getSlotStartId(),
                    schedule.getSlotEndId(),
                    schedule.getFromWeekNo(),
                    schedule.getToWeekNo()
            );
            if (roomConflicts > 0) {
                continue;
            }

            successCount += repository.upsertRoomAllocation(scheduleId, classroomId, staffUserId);
        }

        int failedCount = unassignedIds.size() - successCount;
        if (failedCount > 0) {
            return "Assigned " + successCount + " schedules. " + failedCount
                    + " schedules still need manual resolution.";
        }
        return "Assigned all " + successCount + " schedules successfully.";
    }

    @Transactional(readOnly = true)
    public List<StaffAllocationRepository.AllocationRoomProjection> getAvailableRooms(
            Integer semesterId,
            String dayOfWeekCode,
            Integer timeSlotId,
            Integer expectedAttendees,
            String roomType,
            Integer scheduleId,
            Integer buildingId,
            String search
    ) {
        Integer slotStartId = timeSlotId;
        Integer slotEndId = timeSlotId;
        Integer fromWeekNo = null;
        Integer toWeekNo = null;
        Integer excludedScheduleId = null;
        int requiredAttendees = expectedAttendees;
        String requiredRoomType = roomType == null ? "" : roomType.trim().toUpperCase();

        if (scheduleId != null) {
            StaffAllocationRepository.AssignmentScheduleProjection schedule =
                    repository.findScheduleForAssignment(scheduleId)
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "SCHEDULE_NOT_FOUND",
                                    "Không tìm thấy lịch học."
                            ));
            if (!Objects.equals(schedule.getSemesterId(), semesterId)) {
                throw new BadRequestException(
                        "ALLOCATION_CONFLICT",
                        "Lịch học không thuộc học kỳ đã chọn."
                );
            }
            slotStartId = schedule.getSlotStartId();
            slotEndId = schedule.getSlotEndId();
            dayOfWeekCode = schedule.getDayOfWeekCode();
            fromWeekNo = schedule.getFromWeekNo();
            toWeekNo = schedule.getToWeekNo();
            excludedScheduleId = scheduleId;
            requiredAttendees = Math.max(
                    requiredAttendees,
                    requiredCapacity(schedule.getEnrolledCount(), schedule.getMaxCapacity())
            );
            if (requiredRoomType.isBlank() && schedule.getRequiredRoomType() != null) {
                requiredRoomType = schedule.getRequiredRoomType();
            }
        }

        return repository.findAvailableRoomsForManualAssign(
                semesterId,
                dayOfWeekCode,
                slotStartId,
                slotEndId,
                fromWeekNo,
                toWeekNo,
                excludedScheduleId,
                requiredAttendees,
                requiredRoomType,
                buildingId
        ).stream()
                .filter(room -> isBlank(search)
                        || containsIgnoreCase(room.getRoomCode(), search)
                        || containsIgnoreCase(room.getBuildingCode(), search)
                        || containsIgnoreCase(room.getBuildingName(), search)
                        || containsIgnoreCase(room.getRoomTypeText(), search))
                .toList();
    }

    private AllocationResponse toAllocationResponse(StaffAllocationRepository.AllocationProjection projection) {
        AllocationResponse response = new AllocationResponse();
        response.setSectionId(projection.getSectionId());
        response.setClassCode(projection.getClassCode());
        response.setCourseCode(projection.getCourseCode());
        response.setSectionCode(projection.getSectionCode());
        response.setCourseName(projection.getCourseName());
        response.setLecturerName(projection.getLecturerName());
        response.setEnrolledCount(projection.getEnrolledCount());
        response.setMaxCapacity(projection.getMaxCapacity());
        response.setRequiredRoomType(projection.getRequiredRoomType());
        response.setDayOfWeek(projection.getDayOfWeek());
        response.setSlotNumber(projection.getSlotNumber());
        response.setSlotEndNumber(projection.getSlotEndNumber());
        response.setFromWeekNo(projection.getFromWeekNo());
        response.setToWeekNo(projection.getToWeekNo());
        response.setScheduleId(projection.getScheduleId());
        response.setAssignedRoom(projection.getAssignedRoom());
        response.setClassroomId(projection.getAllocationId());
        response.setRoomCapacity(projection.getRoomCapacity());
        response.setScheduleStatus(projection.getScheduleStatus());
        response.setValidationStatus(projection.getValidationStatus());
        response.setConflictReason(projection.getConflictReason());
        response.setNote(projection.getNote());

        boolean unassigned = projection.getAllocationId() == null
                || "UNASSIGNED".equalsIgnoreCase(projection.getScheduleStatus());
        response.setAllocationStatus(unassigned ? "UNASSIGNED" : "ASSIGNED");
        if (unassigned) {
            response.setStatus("UNASSIGNED");
        } else if ("CONFLICT".equalsIgnoreCase(projection.getValidationStatus())) {
            response.setStatus("CONFLICT");
        } else {
            response.setStatus("VALID");
        }
        return response;
    }

    private void addSingleScheduleConflicts(
            List<ConflictResponse> conflicts,
            StaffAllocationRepository.AllocationProjection schedule,
            StaffAllocationRepository.WeekBoundsProjection bounds,
            List<StaffAllocationRepository.CalendarBlockConflictProjection> calendarBlocks
    ) {
        if (hasInvalidTimeRange(schedule)) {
            conflicts.add(conflict(schedule, "INVALID_TIME_RANGE", "HIGH",
                    "End time or end slot is before the start time or start slot.", null));
        }

        if (hasInvalidWeekRange(schedule, bounds)) {
            conflicts.add(conflict(schedule, "INVALID_WEEK_RANGE", "HIGH",
                    "The schedule week range is invalid or outside semester weeks.", null));
        }

        boolean unassigned = schedule.getAllocationId() == null
                || "UNASSIGNED".equalsIgnoreCase(schedule.getScheduleStatus());
        if (unassigned) {
            conflicts.add(conflict(schedule, "UNASSIGNED", "MEDIUM",
                    "The schedule has not been assigned to a classroom.", null));
        } else {
            if (Boolean.FALSE.equals(schedule.getRoomActive()) || Boolean.TRUE.equals(schedule.getRoomDeleted())) {
                conflicts.add(conflict(schedule, "ROOM_INACTIVE_OR_DELETED", "HIGH",
                        "The assigned classroom is inactive or deleted.", null));
            }

            if (schedule.getRequiredRoomType() != null
                    && schedule.getAssignedRoomType() != null
                    && !schedule.getRequiredRoomType().equalsIgnoreCase(schedule.getAssignedRoomType())) {
                conflicts.add(conflict(schedule, "ROOM_TYPE_MISMATCH", "HIGH",
                        "Required room type is " + schedule.getRequiredRoomType()
                                + " but assigned room type is " + schedule.getAssignedRoomType() + ".", null));
            }

            int requiredCapacity = requiredCapacity(schedule.getEnrolledCount(), schedule.getMaxCapacity());
            if (schedule.getRoomCapacity() != null && schedule.getRoomCapacity() < requiredCapacity) {
                conflicts.add(conflict(schedule, "CAPACITY_EXCEEDED", "HIGH",
                        "Room " + schedule.getAssignedRoom() + " has capacity " + schedule.getRoomCapacity()
                                + " but the schedule requires " + requiredCapacity + ".", null));
            }
        }

    }

    private void addGroupedPairConflicts(
            List<ConflictResponse> conflicts,
            List<StaffAllocationRepository.AllocationProjection> schedules,
            StaffAllocationRepository.WeekBoundsProjection bounds
    ) {
        Map<ConflictGroupKey, List<StaffAllocationRepository.AllocationProjection>> roomGroups =
                new HashMap<>();
        Map<ConflictGroupKey, List<StaffAllocationRepository.AllocationProjection>> lecturerGroups =
                new HashMap<>();

        for (StaffAllocationRepository.AllocationProjection schedule : schedules) {
            if (schedule.getDayOfWeekCode() == null) {
                continue;
            }
            if (schedule.getAllocationId() != null) {
                roomGroups.computeIfAbsent(
                        new ConflictGroupKey(
                                schedule.getSemesterId(),
                                schedule.getDayOfWeekCode(),
                                schedule.getAllocationId()
                        ),
                        ignored -> new ArrayList<>()
                ).add(schedule);
            }
            if (schedule.getLecturerId() != null) {
                lecturerGroups.computeIfAbsent(
                        new ConflictGroupKey(
                                schedule.getSemesterId(),
                                schedule.getDayOfWeekCode(),
                                schedule.getLecturerId()
                        ),
                        ignored -> new ArrayList<>()
                ).add(schedule);
            }
        }

        roomGroups.values().forEach(group -> addRoomPairConflicts(conflicts, group, bounds));
        lecturerGroups.values().forEach(group -> addLecturerPairConflicts(conflicts, group, bounds));
    }

    private void addRoomPairConflicts(
            List<ConflictResponse> conflicts,
            List<StaffAllocationRepository.AllocationProjection> group,
            StaffAllocationRepository.WeekBoundsProjection bounds
    ) {
        forEachOverlappingPair(group, bounds, (left, right) -> {
            conflicts.add(conflict(left, "ROOM_TIME_CONFLICT", "HIGH",
                    "Room " + left.getAssignedRoom() + " overlaps with " + displaySectionRef(right) + ".",
                    displaySectionRef(right)));
            conflicts.add(conflict(right, "ROOM_TIME_CONFLICT", "HIGH",
                    "Room " + right.getAssignedRoom() + " overlaps with " + displaySectionRef(left) + ".",
                    displaySectionRef(left)));
        });
    }

    private void addLecturerPairConflicts(
            List<ConflictResponse> conflicts,
            List<StaffAllocationRepository.AllocationProjection> group,
            StaffAllocationRepository.WeekBoundsProjection bounds
    ) {
        forEachOverlappingPair(group, bounds, (left, right) -> {
            conflicts.add(conflict(left, "LECTURER_TIME_CONFLICT", "HIGH",
                    "Lecturer " + left.getLecturerName() + " also teaches " + displaySectionRef(right) + ".",
                    displaySectionRef(right)));
            conflicts.add(conflict(right, "LECTURER_TIME_CONFLICT", "HIGH",
                    "Lecturer " + right.getLecturerName() + " also teaches " + displaySectionRef(left) + ".",
                    displaySectionRef(left)));
        });
    }

    private void forEachOverlappingPair(
            List<StaffAllocationRepository.AllocationProjection> group,
            StaffAllocationRepository.WeekBoundsProjection bounds,
            SchedulePairConsumer consumer
    ) {
        for (int leftIndex = 0; leftIndex < group.size(); leftIndex++) {
            StaffAllocationRepository.AllocationProjection left = group.get(leftIndex);
            for (int rightIndex = leftIndex + 1; rightIndex < group.size(); rightIndex++) {
                StaffAllocationRepository.AllocationProjection right = group.get(rightIndex);
                if (slotsOverlap(left, right) && weeksOverlap(left, right, bounds)) {
                    consumer.accept(left, right);
                }
            }
        }
    }

    private String displaySectionRef(StaffAllocationRepository.AllocationProjection schedule) {
        if (isBlank(schedule.getCourseCode())) {
            return schedule.getSectionCode();
        }
        return schedule.getCourseCode() + " · " + schedule.getSectionCode();
    }

    private ConflictResponse conflict(
            StaffAllocationRepository.AllocationProjection schedule,
            String type,
            String severity,
            String description,
            String conflictingWith
    ) {
        ConflictResponse response = new ConflictResponse();
        response.setScheduleId(schedule.getScheduleId());
        response.setConflictType(type);
        response.setSeverity(severity);
        response.setDayOfWeek(schedule.getDayOfWeek());
        response.setSlotNumber(schedule.getSlotNumber());
        response.setRoomCode(schedule.getAssignedRoom());
        response.setClassCode(schedule.getClassCode());
        response.setCourseCode(schedule.getCourseCode());
        response.setSectionCode(schedule.getSectionCode());
        response.setCourseName(schedule.getCourseName());
        response.setLecturerName(schedule.getLecturerName());
        response.setEnrolledCount(schedule.getEnrolledCount());
        response.setMaxCapacity(schedule.getMaxCapacity());
        response.setRequiredRoomType(schedule.getRequiredRoomType());
        response.setSlotEndNumber(schedule.getSlotEndNumber());
        response.setDescription(description);
        response.setConflictingWith(conflictingWith);
        return response;
    }

    private void updateValidationStatuses(Integer semesterId, List<ConflictResponse> conflicts) {
        repository.markSchedulesValid(semesterId);

        Map<Integer, String> primaryConflicts = new HashMap<>();
        for (ConflictResponse conflict : conflicts) {
            primaryConflicts.merge(
                    conflict.getScheduleId(),
                    conflict.getConflictType(),
                    (current, candidate) -> priorityOf(candidate) < priorityOf(current) ? candidate : current
            );
        }
        primaryConflicts.forEach(repository::markScheduleConflict);
    }

    private void validateAssignableSchedule(StaffAllocationRepository.AssignmentScheduleProjection schedule) {
        if (!"ACTIVE".equalsIgnoreCase(schedule.getSectionStatus())) {
            throw new BadRequestException(
                    "ALLOCATION_CONFLICT",
                    "Lớp học phần không còn hoạt động."
            );
        }
        if ("CANCELLED".equalsIgnoreCase(schedule.getScheduleStatus())
                || "INACTIVE".equalsIgnoreCase(schedule.getScheduleStatus())) {
            throw new BadRequestException(
                    "ALLOCATION_CONFLICT",
                    "Lịch học đã hủy hoặc ngừng hoạt động, không thể phân phòng."
            );
        }

        StaffAllocationRepository.WeekBoundsProjection bounds = repository.findWeekBounds(schedule.getSemesterId());
        if (hasInvalidWeekRange(schedule, bounds)) {
            throw new BadRequestException(
                    "INVALID_WEEK_RANGE",
                    "Khoảng tuần của lịch học không hợp lệ."
            );
        }
        if (hasInvalidTimeRange(schedule)) {
            throw new BadRequestException(
                    "INVALID_TIME_RANGE",
                    "Khoảng thời gian của lịch học không hợp lệ."
            );
        }
    }

    private void validateRoomForSchedule(
            StaffAllocationRepository.AssignmentRoomProjection room,
            StaffAllocationRepository.AssignmentScheduleProjection schedule
    ) {
        if (!Boolean.TRUE.equals(room.getActive()) || Boolean.TRUE.equals(room.getDeleted())) {
            throw new BadRequestException(
                    "ROOM_INACTIVE_OR_DELETED",
                    "Phòng " + room.getRoomCode() + " đã ngừng hoạt động hoặc bị xóa."
            );
        }
        if (schedule.getRequiredRoomType() != null
                && !schedule.getRequiredRoomType().isBlank()
                && !schedule.getRequiredRoomType().equalsIgnoreCase(room.getRoomType())) {
            throw new BadRequestException(
                    "ROOM_TYPE_MISMATCH",
                    "Lịch yêu cầu phòng " + schedule.getRequiredRoomType()
                            + " nhưng phòng " + room.getRoomCode() + " có loại " + room.getRoomType() + "."
            );
        }

        int requiredCapacity = requiredCapacity(schedule.getEnrolledCount(), schedule.getMaxCapacity());
        if (room.getCapacity() == null || room.getCapacity() < requiredCapacity) {
            throw new BadRequestException(
                    "CAPACITY_EXCEEDED",
                    "Phòng " + room.getRoomCode() + " có sức chứa " + room.getCapacity()
                            + " nhưng lịch học cần " + requiredCapacity + " chỗ."
            );
        }
    }

    private boolean isAutoAssignable(StaffAllocationRepository.AssignmentScheduleProjection schedule) {
        if (!"ACTIVE".equalsIgnoreCase(schedule.getSectionStatus())
                || "CANCELLED".equalsIgnoreCase(schedule.getScheduleStatus())
                || "INACTIVE".equalsIgnoreCase(schedule.getScheduleStatus())) {
            return false;
        }
        StaffAllocationRepository.WeekBoundsProjection bounds = repository.findWeekBounds(schedule.getSemesterId());
        return !hasInvalidWeekRange(schedule, bounds) && !hasInvalidTimeRange(schedule);
    }

    private boolean hasInvalidWeekRange(
            StaffAllocationRepository.AllocationProjection schedule,
            StaffAllocationRepository.WeekBoundsProjection bounds
    ) {
        return hasInvalidWeekRange(schedule.getFromWeekNo(), schedule.getToWeekNo(), bounds);
    }

    private boolean hasInvalidWeekRange(
            StaffAllocationRepository.AssignmentScheduleProjection schedule,
            StaffAllocationRepository.WeekBoundsProjection bounds
    ) {
        return hasInvalidWeekRange(schedule.getFromWeekNo(), schedule.getToWeekNo(), bounds);
    }

    private boolean hasInvalidWeekRange(
            Integer fromWeekNo,
            Integer toWeekNo,
            StaffAllocationRepository.WeekBoundsProjection bounds
    ) {
        if (fromWeekNo == null && toWeekNo != null) {
            return true;
        }
        if (fromWeekNo != null && fromWeekNo <= 0) {
            return true;
        }
        if (toWeekNo != null && (toWeekNo <= 0 || fromWeekNo == null || toWeekNo < fromWeekNo)) {
            return true;
        }
        if (bounds == null || bounds.getMinWeekNo() == null || bounds.getMaxWeekNo() == null) {
            return false;
        }
        int effectiveFrom = fromWeekNo == null ? bounds.getMinWeekNo() : fromWeekNo;
        int effectiveTo = toWeekNo == null ? bounds.getMaxWeekNo() : toWeekNo;
        return effectiveFrom < bounds.getMinWeekNo() || effectiveTo > bounds.getMaxWeekNo();
    }

    private boolean hasInvalidTimeRange(StaffAllocationRepository.AllocationProjection schedule) {
        return schedule.getSlotNumber() == null
                || schedule.getSlotEndNumber() == null
                || schedule.getSlotEndNumber() < schedule.getSlotNumber()
                || schedule.getStartTime() == null
                || schedule.getEndTime() == null
                || !schedule.getEndTime().isAfter(schedule.getStartTime());
    }

    private boolean hasInvalidTimeRange(StaffAllocationRepository.AssignmentScheduleProjection schedule) {
        return schedule.getSlotStartNumber() == null
                || schedule.getSlotEndNumber() == null
                || schedule.getSlotEndNumber() < schedule.getSlotStartNumber()
                || schedule.getStartTime() == null
                || schedule.getEndTime() == null
                || !schedule.getEndTime().isAfter(schedule.getStartTime());
    }

    private boolean slotsOverlap(
            StaffAllocationRepository.AllocationProjection left,
            StaffAllocationRepository.AllocationProjection right
    ) {
        if (left.getSlotNumber() == null || left.getSlotEndNumber() == null
                || right.getSlotNumber() == null || right.getSlotEndNumber() == null) {
            return false;
        }
        return left.getSlotNumber() <= right.getSlotEndNumber()
                && right.getSlotNumber() <= left.getSlotEndNumber();
    }

    private boolean weeksOverlap(
            StaffAllocationRepository.AllocationProjection left,
            StaffAllocationRepository.AllocationProjection right,
            StaffAllocationRepository.WeekBoundsProjection bounds
    ) {
        int defaultFirst = bounds != null && bounds.getMinWeekNo() != null
                ? bounds.getMinWeekNo() : DEFAULT_FIRST_WEEK;
        int defaultLast = bounds != null && bounds.getMaxWeekNo() != null
                ? bounds.getMaxWeekNo() : DEFAULT_LAST_WEEK;
        int leftFrom = left.getFromWeekNo() == null ? defaultFirst : left.getFromWeekNo();
        int leftTo = left.getToWeekNo() == null ? defaultLast : left.getToWeekNo();
        int rightFrom = right.getFromWeekNo() == null ? defaultFirst : right.getFromWeekNo();
        int rightTo = right.getToWeekNo() == null ? defaultLast : right.getToWeekNo();
        return leftFrom <= rightTo && rightFrom <= leftTo;
    }

    private int requiredCapacity(Integer enrolledCount, Integer maxCapacity) {
        return Math.max(enrolledCount == null ? 0 : enrolledCount, maxCapacity == null ? 0 : maxCapacity);
    }

    private int priorityOf(String conflictType) {
        return CONFLICT_PRIORITY.getOrDefault(conflictType, Integer.MAX_VALUE);
    }

    private boolean matchesAllocationSearch(AllocationResponse allocation, String search) {
        return isBlank(search)
                || containsIgnoreCase(allocation.getClassCode(), search)
                || containsIgnoreCase(allocation.getCourseCode(), search)
                || containsIgnoreCase(allocation.getSectionCode(), search)
                || containsIgnoreCase(allocation.getCourseName(), search)
                || containsIgnoreCase(allocation.getAssignedRoom(), search);
    }

    private boolean matchesConflictSearch(ConflictResponse conflict, String search) {
        return isBlank(search)
                || containsIgnoreCase(conflict.getClassCode(), search)
                || containsIgnoreCase(conflict.getCourseCode(), search)
                || containsIgnoreCase(conflict.getSectionCode(), search)
                || containsIgnoreCase(conflict.getCourseName(), search)
                || containsIgnoreCase(conflict.getRoomCode(), search)
                || containsIgnoreCase(conflict.getDescription(), search)
                || containsIgnoreCase(conflict.getConflictingWith(), search);
    }

    private boolean containsIgnoreCase(String value, String search) {
        return value != null && value.toLowerCase(Locale.ROOT)
                .contains(search.trim().toLowerCase(Locale.ROOT));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record ConflictCalculation(
            List<StaffAllocationRepository.AllocationProjection> schedules,
            List<ConflictResponse> conflicts
    ) {
    }

    private record ConflictGroupKey(Integer semesterId, String dayOfWeek, Integer ownerId) {
    }

    @FunctionalInterface
    private interface SchedulePairConsumer {
        void accept(
                StaffAllocationRepository.AllocationProjection left,
                StaffAllocationRepository.AllocationProjection right
        );
    }
}
