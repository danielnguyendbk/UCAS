package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.dto.allocation.AllocationValidationSummary;

public interface AllocationValidationService {

    AllocationValidationSummary validateAllocations(Integer semesterId);
}
