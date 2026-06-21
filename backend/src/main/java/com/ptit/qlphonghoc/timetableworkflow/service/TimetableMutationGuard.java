package com.ptit.qlphonghoc.timetableworkflow.service;

import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowStore;
import org.springframework.stereotype.Service;

@Service
public class TimetableMutationGuard implements TimetableMutationPolicy {

    public static final String PUBLISHED_ERROR_CODE = "TIMETABLE_ALREADY_PUBLISHED";
    public static final String PUBLISHED_MESSAGE =
            "Thời khóa biểu đã công bố, không thể phân phòng lại trực tiếp.";
    public static final String LOCKED_ERROR_CODE = "TIMETABLE_LOCKED";
    public static final String LOCKED_MESSAGE =
            "Thời khóa biểu đã khóa, mọi thay đổi phải đi qua quy trình yêu cầu.";

    private final TimetableWorkflowStore workflowStore;

    public TimetableMutationGuard(TimetableWorkflowStore workflowStore) {
        this.workflowStore = workflowStore;
    }

    @Override
    public void assertOriginalTimetableMutable(Integer semesterId) {
        TimetableWorkflowStatus status = workflowStore.findSemester(semesterId, true)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SEMESTER_NOT_FOUND",
                        "Không tìm thấy học kỳ."
                ))
                .status();
        if (status == TimetableWorkflowStatus.PUBLISHED) {
            throw new BadRequestException(PUBLISHED_ERROR_CODE, PUBLISHED_MESSAGE);
        }
        if (status == TimetableWorkflowStatus.LOCKED) {
            throw new BadRequestException(LOCKED_ERROR_CODE, LOCKED_MESSAGE);
        }
    }
}
