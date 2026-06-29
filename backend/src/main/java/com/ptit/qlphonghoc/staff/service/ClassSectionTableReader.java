package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;

public interface ClassSectionTableReader {

    StaffSectionTableResponse getById(Integer id);
}
