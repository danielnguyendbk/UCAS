package com.ptit.qlphonghoc.facility.repository;

import com.ptit.qlphonghoc.facility.entity.FacilityStaff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FacilityStaffRepository extends JpaRepository<FacilityStaff, Integer> {

    Optional<FacilityStaff> findByUserId(Integer userId);
}
