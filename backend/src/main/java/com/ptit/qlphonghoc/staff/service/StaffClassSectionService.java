package com.ptit.qlphonghoc.staff.service;

import com.ptit.qlphonghoc.staff.dto.class_section.CreateSectionRequest;
import com.ptit.qlphonghoc.staff.dto.class_section.StaffSectionTableResponse;
import com.ptit.qlphonghoc.staff.dto.class_section.UpdateSectionRequest;
import com.ptit.qlphonghoc.staff.entity.ClassSection;
import com.ptit.qlphonghoc.staff.repository.ClassSectionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

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
                        "Khong tim thay lop hoc phan id = " + id
                ));
    }

    @Transactional
    public StaffSectionTableResponse create(CreateSectionRequest request) {
        validateMainInput(request);
        List<Integer> classIds = normalizeClassIds(request.getClassIds());
        int enrolledCount = validateClassSelection(classIds, request.getMaxCapacity());
        checkSemesterStatus(request.getSemesterId());
        validateScheduleSelection(request);

        ClassSection section = new ClassSection();
        applyRequestToEntity(section, request, enrolledCount);

        ClassSection saved = classSectionRepository.saveAndFlush(section);
        syncSectionEnrollments(saved.getId(), classIds);
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
        validateMainInput(request);
        List<Integer> classIds = normalizeClassIds(request.getClassIds());
        int enrolledCount = validateClassSelection(classIds, request.getMaxCapacity());
        checkSemesterStatus(request.getSemesterId());
        validateScheduleSelection(request);

        ClassSection section = classSectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Khong tim thay lop hoc phan id = " + id
                ));

        applyRequestToEntity(section, request, enrolledCount);
        classSectionRepository.saveAndFlush(section);
        syncSectionEnrollments(id, classIds);
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
        if (classSectionRepository.countActiveClassroomById(request.getClassroomId()) == 0) {
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

    private List<Integer> normalizeClassIds(List<Integer> rawClassIds) {
        if (rawClassIds == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Can chon tu 1 den toi da 2 classes."
            );
        }

        List<Integer> classIds = rawClassIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (classIds.isEmpty() || classIds.size() > 2) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Can chon tu 1 den toi da 2 classes."
            );
        }

        return classIds;
    }

    private int validateClassSelection(List<Integer> classIds, Integer maxCapacity) {
        int activeClassCount = classSectionRepository.countActiveClassesByIds(classIds);
        if (activeClassCount != classIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Danh sach classes khong hop le."
            );
        }

        int studentCount = classSectionRepository.countStudentsByClassIds(classIds);
        if (maxCapacity == null || maxCapacity < studentCount) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "maxCapacity khong duoc nho hon tong so sinh vien cua cac classes da chon."
            );
        }

        return studentCount;
    }

    private void syncSectionEnrollments(Integer sectionId, List<Integer> classIds) {
        classSectionRepository.deactivateEnrollmentsOfSection(sectionId);
        classSectionRepository.enrollStudentsFromClasses(sectionId, classIds);
    }

    private void applyRequestToEntity(ClassSection section, CreateSectionRequest request, int enrolledCount) {
        section.setSemesterId(request.getSemesterId());
        section.setCourseId(request.getCourseId());
        section.setLecturerId(request.getLecturerId());
        section.setSectionCode(request.getSectionCode().trim());
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
        response.setClassIds(parseClassIds(projection.getClassIds()));
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
        response.setSchedule(projection.getSchedule());
        response.setClassroomId(projection.getClassroomId());
        response.setRoom(projection.getRoom());
        response.setAllocationStatus(projection.getAllocationStatus());
        response.setStatusText(projection.getStatusText());
        response.setSectionStatus(projection.getSectionStatus());

        return response;
    }

    private List<Integer> parseClassIds(String classIds) {
        if (classIds == null || classIds.isBlank()) {
            return List.of();
        }

        return Arrays.stream(classIds.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(Integer::valueOf)
                .toList();
    }
}
