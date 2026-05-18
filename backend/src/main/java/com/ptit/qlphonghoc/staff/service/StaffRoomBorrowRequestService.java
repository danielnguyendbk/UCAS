package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.staff.dto.roomborrow.StaffRoomBorrowRequestResponse;
import com.ptit.qlphonghoc.staff.repository.StaffRoomBorrowRequestRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StaffRoomBorrowRequestService {

    private final StaffRoomBorrowRequestRepository repository;

    public StaffRoomBorrowRequestService(StaffRoomBorrowRequestRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<StaffRoomBorrowRequestResponse> getRequests(String status) {
        String normalizedStatus = normalizeStatus(status);
        return repository.findAllRequests(normalizedStatus)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public StaffRoomBorrowRequestResponse approve(Integer id, Integer staffUserId) {
        StaffRoomBorrowRequestRepository.RequestProjection current = findRequest(id);
        if (!"PENDING".equals(current.getStatus())) {
            throw new BadRequestException("Only pending requests can be approved.");
        }
        if (current.getPreferredClassroomId() == null) {
            throw new BadRequestException("This request does not have a preferred classroom to approve.");
        }

        try {
            int updated = repository.approvePendingRequest(
                    id,
                    staffUserId,
                    "Staff đã duyệt."
            );
            if (updated == 0) {
                throw new BadRequestException("Request could not be approved.");
            }
        } catch (DataIntegrityViolationException exception) {
            throw new BadRequestException(rootMessage(exception));
        }

        return toResponse(findRequest(id));
    }

    @Transactional
    public StaffRoomBorrowRequestResponse reject(Integer id, String rejectReason) {
        StaffRoomBorrowRequestRepository.RequestProjection current = findRequest(id);
        if (!"PENDING".equals(current.getStatus())) {
            throw new BadRequestException("Only pending requests can be rejected.");
        }
        if (rejectReason == null || rejectReason.isBlank()) {
            throw new BadRequestException("Reject reason is required.");
        }

        int updated = repository.rejectPendingRequest(id, rejectReason.trim());
        if (updated == 0) {
            throw new BadRequestException("Request could not be rejected.");
        }

        return toResponse(findRequest(id));
    }

    private StaffRoomBorrowRequestRepository.RequestProjection findRequest(Integer id) {
        return repository.findRequestById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room borrow request not found."));
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return "";
        }
        return status.trim().toUpperCase();
    }

    private String rootMessage(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getMessage() == null ? "Request validation failed." : root.getMessage();
    }

    private StaffRoomBorrowRequestResponse toResponse(
            StaffRoomBorrowRequestRepository.RequestProjection projection
    ) {
        StaffRoomBorrowRequestResponse response = new StaffRoomBorrowRequestResponse();
        response.setId(projection.getId());
        response.setRequestTitle(projection.getRequestTitle());
        response.setRequestType(projection.getRequestType());
        response.setBookingScope(projection.getBookingScope());
        response.setSemesterId(projection.getSemesterId());
        response.setSemesterName(projection.getSemesterName());
        response.setBookingDate(projection.getBookingDate());
        response.setSlot(projection.getSlot());
        response.setPeriodText(projection.getPeriodText());
        response.setRequestedBy(projection.getRequestedBy());
        response.setRequesterName(projection.getRequesterName());
        response.setRequesterUsername(projection.getRequesterUsername());
        response.setRequesterRole(projection.getRequesterRole());
        response.setClubId(projection.getClubId());
        response.setClubName(projection.getClubName());
        response.setSectionId(projection.getSectionId());
        response.setSectionCode(projection.getSectionCode());
        response.setCourseName(projection.getCourseName());
        response.setExpectedAttendees(projection.getExpectedAttendees());
        response.setPreferredClassroomId(projection.getPreferredClassroomId());
        response.setPreferredRoomCode(projection.getPreferredRoomCode());
        response.setPreferredRoomCapacity(projection.getPreferredRoomCapacity());
        response.setApprovedClassroomId(projection.getApprovedClassroomId());
        response.setApprovedRoomCode(projection.getApprovedRoomCode());
        response.setRequestedRoomType(projection.getRequestedRoomType());
        response.setPurposeNote(projection.getPurposeNote());
        response.setStatus(projection.getStatus());
        response.setAvailabilityStatus(projection.getAvailabilityStatus());
        response.setProcessingNote(projection.getProcessingNote());
        response.setRejectReason(projection.getRejectReason());
        response.setApprovedBy(projection.getApprovedBy());
        response.setApprovedByName(projection.getApprovedByName());
        response.setApprovedAt(projection.getApprovedAt());
        response.setCreatedAt(projection.getCreatedAt());
        return response;
    }
}
