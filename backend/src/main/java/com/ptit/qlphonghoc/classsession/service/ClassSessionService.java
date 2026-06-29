package com.ptit.qlphonghoc.classsession.service;

import com.ptit.qlphonghoc.classsession.dto.ClassSessionResponse;
import com.ptit.qlphonghoc.classsession.repository.ClassSessionRepository;
import com.ptit.qlphonghoc.lecturer.entity.Lecturer;
import com.ptit.qlphonghoc.lecturer.repository.LecturerRepository;
import com.ptit.qlphonghoc.student.entity.Student;
import com.ptit.qlphonghoc.student.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class ClassSessionService {

    private final ClassSessionRepository classSessionRepository;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;

    public ClassSessionService(
            ClassSessionRepository classSessionRepository,
            StudentRepository studentRepository,
            LecturerRepository lecturerRepository
    ) {
        this.classSessionRepository = classSessionRepository;
        this.studentRepository = studentRepository;
        this.lecturerRepository = lecturerRepository;
    }

    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getStaffClassSessions(
            Integer semesterId,
            Integer weekNo,
            String status,
            Integer lecturerId,
            Integer classroomId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            String search
    ) {
        return classSessionRepository.findClassSessions(
                semesterId,
                weekNo,
                status,
                lecturerId,
                classroomId,
                date,
                startDate,
                endDate,
                search,
                null,
                null
        );
    }

    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getLecturerClassSessions(
            Integer userId,
            Integer semesterId,
            Integer weekNo,
            String status,
            Integer classroomId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            String search
    ) {
        Lecturer lecturer = ensureLecturerProfile(userId);
        return classSessionRepository.findClassSessions(
                semesterId,
                weekNo,
                status,
                null,
                classroomId,
                date,
                startDate,
                endDate,
                search,
                null,
                lecturer.getId()
        );
    }

    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getStudentClassSessions(
            Integer userId,
            Integer semesterId,
            Integer weekNo,
            String status,
            Integer lecturerId,
            Integer classroomId,
            LocalDate date,
            LocalDate startDate,
            LocalDate endDate,
            String search
    ) {
        Student student = ensureStudentProfile(userId);
        return classSessionRepository.findClassSessions(
                semesterId,
                weekNo,
                status,
                lecturerId,
                classroomId,
                date,
                startDate,
                endDate,
                search,
                student.getId(),
                null
        );
    }

    private Lecturer ensureLecturerProfile(Integer userId) {
        return lecturerRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Lecturer profile not found."
                ));
    }

    private Student ensureStudentProfile(Integer userId) {
        return studentRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Student profile not found."
                ));
    }
}
