package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.dto.class_section.CreateSectionRequest;
import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.dto.class_section.UpdateSectionRequest;
import com.ptit.qlphonghoc.staff.entity.ClassSection;
import com.ptit.qlphonghoc.staff.repository.ClassSectionRepository;
import com.ptit.qlphonghoc.timetableworkflow.service.TimetableMutationPolicy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class StaffClassSectionService implements ClassSectionTableReader {

    private final ClassSectionRepository classSectionRepository;
    private final TimetableMutationPolicy mutationPolicy;

    public StaffClassSectionService(
            ClassSectionRepository classSectionRepository,
            TimetableMutationPolicy mutationPolicy
    ) {
        this.classSectionRepository = classSectionRepository;
        this.mutationPolicy = mutationPolicy;
    }

    @Transactional(readOnly = true)
    public List<StaffSectionTableResponse> getTable(Integer semesterId) {
        return classSectionRepository.findStaffTable(semesterId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public StaffSectionTableResponse getById(Integer id) {
        return classSectionRepository.findStaffTableById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Khong tim thay lop hoc phan id = " + id
                ));
    }

    @Transactional
    public StaffSectionTableResponse create(CreateSectionRequest request) {
        mutationPolicy.assertOriginalTimetableMutable(request.getSemesterId());
        validateMainInput(request);
        String className = normalizeClassName(request.getClassName());
        int enrolledCount = validateClassSelection(className, request.getMaxCapacity());
        checkSemesterStatus(request.getSemesterId());
        validateScheduleSelection(request);

        ClassSection section = new ClassSection();
        applyRequestToEntity(section, request, enrolledCount);

        ClassSection saved = classSectionRepository.saveAndFlush(section);
        syncSectionEnrollments(saved.getId(), className);
        saveOrUpdateSchedule(
                saved.getId(),
                request.getClassroomId(),
                request.getDay(),
                request.getSlotStartId(),
                request.getSlotEndId()
        );

        return getById(saved.getId());
    }

    @Transactional
    public StaffSectionTableResponse update(Integer id, UpdateSectionRequest request) {
        ClassSection section = classSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Khong tim thay lop hoc phan id = " + id
                ));
        mutationPolicy.assertOriginalTimetableMutable(section.getSemesterId());
        if (!section.getSemesterId().equals(request.getSemesterId())) {
            mutationPolicy.assertOriginalTimetableMutable(request.getSemesterId());
        }

        validateMainInput(request);
        String className = normalizeClassName(request.getClassName());
        int enrolledCount = validateClassSelection(className, request.getMaxCapacity());
        checkSemesterStatus(request.getSemesterId());
        validateScheduleSelection(request);

        applyRequestToEntity(section, request, enrolledCount);
        classSectionRepository.saveAndFlush(section);
        syncSectionEnrollments(id, className);
        saveOrUpdateSchedule(
                id,
                request.getClassroomId(),
                request.getDay(),
                request.getSlotStartId(),
                request.getSlotEndId()
        );

        return getById(id);
    }

    @Transactional
    public void delete(Integer id) {
        ClassSection section = classSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Khong tim thay lop hoc phan id = " + id
                ));
        mutationPolicy.assertOriginalTimetableMutable(section.getSemesterId());

        if (classSectionRepository.countActiveEnrollmentsBySectionId(id) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khong the xoa lop hoc phan vi dang co sinh vien tham gia."
            );
        }

        classSectionRepository.deactivateSchedulesOfSection(id);
        section.setStatus("CANCELLED");
        classSectionRepository.save(section);
    }

    private void checkSemesterStatus(Integer semesterId) {
        String status = classSectionRepository.findSemesterStatus(semesterId);
        if ("COMPLETED".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khong the them hoac chinh sua lop hoc phan trong hoc ky da hoan thanh."
            );
        }
    }

    private void validateMainInput(CreateSectionRequest request) {
        if (request.getDay() == null || request.getDay().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "day khong duoc de trong."
            );
        }

        if (request.getSectionCode() == null || request.getSectionCode().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "sectionCode khong duoc de trong."
            );
        }
    }

    private void validateScheduleSelection(CreateSectionRequest request) {
        if (request.getClassroomId() != null && classSectionRepository.countActiveClassroomById(request.getClassroomId()) == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phong hoc khong ton tai hoac dang khong hoat dong."
            );
        }

        if (classSectionRepository.countValidSlotRange(request.getSlotStartId(), request.getSlotEndId()) == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tiet ket thuc phai lon hon hoac bang tiet bat dau."
            );
        }
    }

    private String normalizeClassName(String rawClassName) {
        if (rawClassName == null || rawClassName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "className khong duoc de trong."
            );
        }
        return rawClassName.trim();
    }

    private int validateClassSelection(String className, Integer maxCapacity) {
        int studentCount = classSectionRepository.countStudentsByClassName(className);
        if (studentCount == 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Khong tim thay sinh vien nao thuoc className da chon."
            );
        }

        if (maxCapacity == null || maxCapacity < studentCount) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "maxCapacity khong duoc nho hon tong so sinh vien cua className da chon."
            );
        }

        return studentCount;
    }

    private void syncSectionEnrollments(Integer sectionId, String className) {
        classSectionRepository.deactivateEnrollmentsOfSection(sectionId);
        classSectionRepository.enrollStudentsByClassName(sectionId, className);
    }

    private void applyRequestToEntity(ClassSection section, CreateSectionRequest request, int enrolledCount) {
        section.setSemesterId(request.getSemesterId());
        section.setCourseId(request.getCourseId());
        section.setLecturerId(request.getLecturerId());
        section.setSectionCode(request.getSectionCode().trim());
        section.setClassName(request.getClassName().trim());
        section.setEnrolledCount(enrolledCount);
        section.setMaxCapacity(request.getMaxCapacity());

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            section.setStatus("ACTIVE");
        } else {
            section.setStatus(request.getStatus().trim().toUpperCase(Locale.ROOT));
        }
    }

    private Integer saveOrUpdateSchedule(
            Integer sectionId,
            Integer classroomId,
            String rawDay,
            Integer slotStartId,
            Integer slotEndId
    ) {
        String dayOfWeek = normalizeDay(rawDay);
        Integer scheduleId = classSectionRepository.findScheduleIdBySectionId(sectionId)
                .orElse(null);

        if (scheduleId == null) {
            classSectionRepository.insertSchedule(sectionId, classroomId, dayOfWeek, slotStartId, slotEndId);
            return classSectionRepository.findScheduleIdBySectionId(sectionId).orElse(null);
        }

        classSectionRepository.updateScheduleById(scheduleId, classroomId, dayOfWeek, slotStartId, slotEndId);
        return scheduleId;
    }

    private String normalizeDay(String rawDay) {
        String value = removeAccent(rawDay)
                .trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("\\s+", " ");

        return switch (value) {
            case "MON", "MONDAY", "T2", "THU 2", "2" -> "MON";
            case "TUE", "TUESDAY", "T3", "THU 3", "3" -> "TUE";
            case "WED", "WEDNESDAY", "T4", "THU 4", "4" -> "WED";
            case "THU", "THURSDAY", "T5", "THU 5", "5" -> "THU";
            case "FRI", "FRIDAY", "T6", "THU 6", "6" -> "FRI";
            case "SAT", "SATURDAY", "T7", "THU 7", "7" -> "SAT";
            case "SUN", "SUNDAY", "CN", "CHU NHAT" -> "SUN";
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "day khong hop le. Dung MON/TUE/... hoac Thu 2/Thu 3/..."
            );
        };
    }

    private String removeAccent(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{M}", "")
                .replace('\u0111', 'd')
                .replace('\u0110', 'D');
    }

    private StaffSectionTableResponse toResponse(
            ClassSectionRepository.StaffSectionTableProjection projection
    ) {
        StaffSectionTableResponse response = new StaffSectionTableResponse();

        response.setId(projection.getId());
        response.setScheduleId(projection.getScheduleId());
        response.setSectionCode(projection.getSectionCode());
        response.setClassCode(projection.getClassCode());
        response.setCourseCode(projection.getCourseCode());
        response.setCourseName(projection.getCourseName());
        response.setFacultyCode(projection.getFacultyCode());
        response.setDepartmentCode(projection.getDepartmentCode());
        response.setCredits(projection.getCredits());
        response.setRequiredRoomType(projection.getRequiredRoomType());
        response.setStudentCount(projection.getStudentCount());
        response.setSemesterId(projection.getSemesterId());
        response.setCourseId(projection.getCourseId());
        response.setLecturerId(projection.getLecturerId());
        response.setMaxCapacity(projection.getMaxCapacity());
        response.setClassIds(List.of());
        response.setClassCodes(projection.getClassCodes());
        response.setClassNames(projection.getClassNames());
        response.setLecturerName(projection.getLecturerName());
        response.setDay(projection.getDay());
        response.setDayCode(projection.getDayCode());
        response.setSlot(projection.getSlot());
        response.setSlotStartId(projection.getSlotStartId());
        response.setSlotEndId(projection.getSlotEndId());
        response.setSlotStart(projection.getSlotStart());
        response.setSlotEnd(projection.getSlotEnd());
        response.setFromWeekNo(projection.getFromWeekNo());
        response.setToWeekNo(projection.getToWeekNo());
        response.setSchedule(projection.getSchedule());
        response.setClassroomId(projection.getClassroomId());
        response.setRoomCapacity(projection.getRoomCapacity());
        response.setRoom(projection.getRoom());
        response.setClassroomCode(projection.getClassroomCode());
        response.setScheduleStatus(projection.getScheduleStatus());
        response.setValidationStatus(projection.getValidationStatus());
        response.setConflictReason(projection.getConflictReason());
        response.setNote(projection.getNote());
        response.setAllocationStatus(projection.getAllocationStatus());
        response.setStatusText(projection.getStatusText());
        response.setSectionStatus(projection.getSectionStatus());
        // --- THÊM 2 DÒNG NÀY ĐỂ ĐẨY GIỜ SANG DTO ---
        response.setStartTime(projection.getStartTime());
        response.setEndTime(projection.getEndTime());

        return response;
    }

}
