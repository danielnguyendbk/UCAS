package com.ptit.qlphonghoc.facility.repository;

import com.ptit.qlphonghoc.facility.entity.FacilityBuildingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacilityBuildingAssignmentRepository extends JpaRepository<FacilityBuildingAssignment, Long> {

    Optional<FacilityBuildingAssignment> findBySemesterIdAndFacilityStaffId(Long semesterId, Long facilityStaffId);

    List<FacilityBuildingAssignment> findBySemesterIdAndFacilityStaffIdAndStatus(Long semesterId, Long facilityStaffId, String status);
}
