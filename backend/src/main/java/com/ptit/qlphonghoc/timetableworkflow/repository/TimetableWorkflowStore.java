package com.ptit.qlphonghoc.timetableworkflow.repository;

import com.ptit.qlphonghoc.timetableworkflow.TimetableWorkflowStatus;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowRepository.SemesterWorkflowState;
import com.ptit.qlphonghoc.timetableworkflow.repository.TimetableWorkflowRepository.ValidationCounts;

import java.util.Optional;

public interface TimetableWorkflowStore {

    Optional<SemesterWorkflowState> findSemester(Integer semesterId, boolean forUpdate);

    int updateStatus(Integer semesterId, TimetableWorkflowStatus status);

    ValidationCounts findValidationCounts(Integer semesterId);
}
