package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.dto.allocation.AllocationResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ConflictResponse;
import com.ptit.qlphonghoc.staff.dto.allocation.ManualAssignRequest;
import com.ptit.qlphonghoc.staff.repository.StaffAllocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class StaffAllocationService {

    private final StaffAllocationRepository repository;

    public StaffAllocationService(StaffAllocationRepository repository) {
        this.repository = repository;
    }

    public List<AllocationResponse> getAllocations(Integer semesterId) {
        List<StaffAllocationRepository.AllocationProjection> projections = repository.findAllSchedulesBySemester(semesterId);
        List<AllocationResponse> responses = new ArrayList<>();

        for (var p : projections) {
            AllocationResponse res = new AllocationResponse();
            res.setSectionId(p.getSectionId());
            res.setClassCode(p.getClassCode());
            res.setSectionCode(p.getSectionCode());
            res.setCourseName(p.getCourseName());
            res.setEnrolledCount(p.getEnrolledCount());
            res.setMaxCapacity(p.getMaxCapacity()); // SET MAX CAPACITY VÀO ĐÂY
            res.setRequiredRoomType(p.getRequiredRoomType());
            res.setDayOfWeek(p.getDayOfWeek());
            res.setSlotNumber(p.getSlotNumber());
            res.setScheduleId(p.getScheduleId());
            res.setAssignedRoom(p.getAssignedRoom());
            res.setRoomCapacity(p.getRoomCapacity());

            if (p.getAllocationId() == null) {
                res.setStatus("UNASSIGNED");
            } else if (p.getRoomCapacity() != null && p.getRoomCapacity() < p.getMaxCapacity()) {
                res.setStatus("CONFLICT"); // KIỂM TRA XUNG ĐỘT SO VỚI MAX CAPACITY
            } else {
                res.setStatus("VALID");
            }
            responses.add(res);
        }
        return responses;
    }

    public List<ConflictResponse> getConflicts(Integer semesterId) {
        List<StaffAllocationRepository.AllocationProjection> projections = repository.findAllSchedulesBySemester(semesterId);
        List<ConflictResponse> conflicts = new ArrayList<>();

        for (var p : projections) {
            if (p.getAllocationId() == null) {
                ConflictResponse c = new ConflictResponse();
                c.setConflictType("UNASSIGNED");
                c.setSeverity("MEDIUM");
                c.setDayOfWeek(p.getDayOfWeek());
                c.setSlotNumber(p.getSlotNumber());
                c.setSectionCode(p.getSectionCode());
                c.setCourseName(p.getCourseName());
                c.setDescription("Lớp chưa được phân phòng, sinh viên không có nơi học.");
                conflicts.add(c);
            } else if (p.getRoomCapacity() != null && p.getRoomCapacity() < p.getMaxCapacity()) {
                ConflictResponse c = new ConflictResponse();
                c.setConflictType("CAPACITY_EXCEEDED");
                c.setSeverity("HIGH");
                c.setDayOfWeek(p.getDayOfWeek());
                c.setSlotNumber(p.getSlotNumber());
                c.setRoomCode(p.getAssignedRoom());
                c.setSectionCode(p.getSectionCode());
                c.setCourseName(p.getCourseName());
                c.setDescription("Phòng " + p.getAssignedRoom() + " có sức chứa " + p.getRoomCapacity() + ", nhưng lớp yêu cầu " + p.getMaxCapacity() + " chỗ.");
                conflicts.add(c);
            }
        }
        return conflicts;
    }

    @Transactional
    public void manualAssign(ManualAssignRequest request, Integer staffUserId) {
        repository.upsertRoomAllocation(request.getScheduleId(), request.getClassroomId(), staffUserId);
    }

    @Transactional
    public String autoAssign(Integer semesterId, Integer staffUserId) {
        List<Integer> unassignedIds = repository.findUnassignedScheduleIds(semesterId);
        int successCount = 0;

        for (Integer sid : unassignedIds) {
            String dayOfWeek = repository.getDayOfWeekBySchedule(sid);
            Integer timeSlotId = repository.getTimeSlotIdBySchedule(sid);
            String requiredRoomType = repository.getRequiredRoomTypeBySchedule(sid);
            Integer maxCapacity = repository.getMaxCapacityBySchedule(sid); // LẤY MAX CAPACITY ĐỂ AUTO ASSIGN

            Optional<Integer> availableRoomId = repository.findAvailableRoomForAutoAssign(
                    semesterId, dayOfWeek, timeSlotId, requiredRoomType, maxCapacity
            );

            if (availableRoomId.isPresent()) {
                repository.upsertRoomAllocation(sid, availableRoomId.get(), staffUserId);
                successCount++;
            }
        }

        int failedCount = unassignedIds.size() - successCount;
        if (failedCount > 0) {
            return "Đã phân thành công " + successCount + " lớp. Còn " + failedCount + " lớp không tìm được phòng phù hợp (vui lòng xử lý thủ công).";
        }
        return "Đã phân thành công tất cả " + successCount + " lớp!";
    }
    public List<StaffAllocationRepository.AllocationRoomProjection> getAvailableRooms(
            Integer semesterId, String dowCode, Integer timeSlotId, Integer expectedAttendees, String roomType) {
        return repository.findAvailableRoomsForManualAssign(semesterId, dowCode, timeSlotId, expectedAttendees, roomType);
    }
}
