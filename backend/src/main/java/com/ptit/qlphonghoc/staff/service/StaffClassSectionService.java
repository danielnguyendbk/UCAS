package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.entity.ClassSection;
import com.ptit.qlphonghoc.staff.repository.ClassSectionRepository;
import com.ptit.qlphonghoc.staff.dto.class_section.CreateSectionRequest;
import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.dto.class_section.UpdateSectionRequest;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class StaffClassSectionService {

    private final ClassSectionRepository classSectionRepository;

    public StaffClassSectionService(ClassSectionRepository classSectionRepository) {
        this.classSectionRepository = classSectionRepository;
    }

    @Transactional(readOnly = true)
    public List<StaffSectionTableResponse> getTable(Integer semesterId) {
        return classSectionRepository.findStaffTable(semesterId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StaffSectionTableResponse getById(Integer id) {
        return classSectionRepository.findStaffTableById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy lớp học phần id = " + id
                ));
    }

    @Transactional
    public StaffSectionTableResponse create(CreateSectionRequest request) {
        validateMainInput(request);
        
        // KIỂM TRA TRẠNG THÁI HỌC KỲ TRƯỚC KHI THÊM
        checkSemesterStatus(request.getSemesterId());

        ClassSection section = new ClassSection();
        applyRequestToEntity(section, request);

        ClassSection saved = classSectionRepository.saveAndFlush(section);

        saveOrUpdateSchedule(
                saved.getId(),
                request.getDay(),
                request.getSlot()
        );

        return getById(saved.getId());
    }

    @Transactional
    public StaffSectionTableResponse update(Integer id, UpdateSectionRequest request) {
        validateMainInput(request);

        // KIỂM TRA TRẠNG THÁI HỌC KỲ TRƯỚC KHI SỬA
        checkSemesterStatus(request.getSemesterId());

        ClassSection section = classSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy lớp học phần id = " + id
                ));

        applyRequestToEntity(section, request);
        classSectionRepository.saveAndFlush(section);

        saveOrUpdateSchedule(
                id,
                request.getDay(),
                request.getSlot()
        );

        return getById(id);
    }

    @Transactional
    public void delete(Integer id) {
        ClassSection section = classSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy lớp học phần id = " + id
                ));

        classSectionRepository.deactivateRoomAllocationsOfSection(id);
        classSectionRepository.deactivateSchedulesOfSection(id);

        section.setStatus("CANCELLED");
        classSectionRepository.save(section);
    }

    // HÀM KIỂM TRA HỌC KỲ (SỬ DỤNG CHUNG CHO CREATE VÀ UPDATE)
    private void checkSemesterStatus(Integer semesterId) {
        String status = classSectionRepository.findSemesterStatus(semesterId);
        if ("COMPLETED".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể thêm hoặc chỉnh sửa lớp học phần trong học kỳ đã hoàn thành."
            );
        }
    }

    private void validateMainInput(CreateSectionRequest request) {
        if (request.getSlot() == null || request.getSlot() < 1 || request.getSlot() > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "slot chỉ nhận giá trị 1, 2, 3, 4, 5."
            );
        }

        if (request.getDay() == null || request.getDay().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "day không được để trống."
            );
        }
    }

    private void applyRequestToEntity(ClassSection section, CreateSectionRequest request) {
        section.setSemesterId(request.getSemesterId());
        section.setCourseId(request.getCourseId());
        section.setLecturerId(request.getLecturerId());
        section.setSectionCode(request.getSectionCode().trim());

        if (request.getEnrolledCount() == null) {
            section.setEnrolledCount(0);
        } else {
            section.setEnrolledCount(request.getEnrolledCount());
        }

        section.setMaxCapacity(request.getMaxCapacity());

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            section.setStatus("ACTIVE");
        } else {
            section.setStatus(request.getStatus().trim().toUpperCase(Locale.ROOT));
        }
    }

    private Integer saveOrUpdateSchedule(Integer sectionId, String rawDay, Integer slotNumber) {
        String dayOfWeek = normalizeDay(rawDay);

        Integer timeSlotId = classSectionRepository.findTimeSlotIdBySlotNumber(slotNumber)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không tồn tại time_slot với slot_number = " + slotNumber
                ));

        Integer scheduleId = classSectionRepository.findScheduleIdBySectionId(sectionId)
                .orElse(null);

        if (scheduleId == null) {
            classSectionRepository.insertSchedule(sectionId, dayOfWeek, timeSlotId);

            return classSectionRepository.findScheduleIdBySectionId(sectionId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR,
                            "Tạo lịch học thất bại."
                    ));
        }

        classSectionRepository.updateScheduleById(scheduleId, dayOfWeek, timeSlotId);

        return scheduleId;
    }

    private String normalizeDay(String rawDay) {
        String value = removeAccent(rawDay)
                .trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", " ");

        switch (value) {
            case "MON":
            case "MONDAY":
            case "T2":
            case "THU 2":
            case "2":
                return "MON";

            case "TUE":
            case "TUESDAY":
            case "T3":
            case "THU 3":
            case "3":
                return "TUE";

            case "WED":
            case "WEDNESDAY":
            case "T4":
            case "THU 4":
            case "4":
                return "WED";

            case "THU":
            case "THURSDAY":
            case "T5":
            case "THU 5":
            case "5":
                return "THU";

            case "FRI":
            case "FRIDAY":
            case "T6":
            case "THU 6":
            case "6":
                return "FRI";

            case "SAT":
            case "SATURDAY":
            case "T7":
            case "THU 7":
            case "7":
                return "SAT";

            case "SUN":
            case "SUNDAY":
            case "CN":
            case "CHU NHAT":
                return "SUN";

            default:
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "day không hợp lệ. Dùng MON/TUE/... hoặc Thứ 2/Thứ 3/..."
                );
        }
    }

    private String removeAccent(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
    }

    private StaffSectionTableResponse toResponse(
            ClassSectionRepository.StaffSectionTableProjection projection
    ) {
        StaffSectionTableResponse response = new StaffSectionTableResponse();

        response.setId(projection.getId());
        response.setClassCode(projection.getClassCode());
        response.setCourseName(projection.getCourseName());
        response.setFacultyCode(projection.getFacultyCode());
        response.setDepartmentCode(projection.getDepartmentCode());
        response.setCredits(projection.getCredits());
        response.setStudentCount(projection.getStudentCount());
        response.setSemesterId(projection.getSemesterId());
        response.setCourseId(projection.getCourseId());
        response.setLecturerId(projection.getLecturerId());
        response.setMaxCapacity(projection.getMaxCapacity());
        response.setLecturerName(projection.getLecturerName());
        response.setDay(projection.getDay());
        response.setDayCode(projection.getDayCode());
        response.setSlot(projection.getSlot());
        response.setSchedule(projection.getSchedule());
        response.setClassroomId(projection.getClassroomId());
        response.setRoom(projection.getRoom());
        response.setAllocationStatus(projection.getAllocationStatus());
        response.setStatusText(projection.getStatusText());
        response.setSectionStatus(projection.getSectionStatus());

        return response;
    }
}
