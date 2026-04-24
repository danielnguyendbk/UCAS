package com.ptit.qlphonghoc.config;

import com.ptit.qlphonghoc.facility.entity.FacilityStaff;
import com.ptit.qlphonghoc.facility.repository.FacilityStaffRepository;
import com.ptit.qlphonghoc.lecturer.entity.Lecturer;
import com.ptit.qlphonghoc.lecturer.repository.LecturerRepository;
import com.ptit.qlphonghoc.student.entity.Student;
import com.ptit.qlphonghoc.student.repository.StudentRepository;
import com.ptit.qlphonghoc.user.entity.User;
import com.ptit.qlphonghoc.user.enumtype.UserRole;
import com.ptit.qlphonghoc.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedDataConfig {

    @Bean
    @ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
    CommandLineRunner seedData(UserRepository userRepository,
                               LecturerRepository lecturerRepository,
                               StudentRepository studentRepository,
                               FacilityStaffRepository facilityStaffRepository,
                               PasswordEncoder passwordEncoder) {
        return args -> {
            // Optional local seed only. Role-specific profiles still depend on existing referenced master data.
            ensureUser(userRepository, passwordEncoder, "admin01", "admin01@ptit.edu.vn", "System Admin", UserRole.ADMIN);
            ensureUser(userRepository, passwordEncoder, "staff01", "staff01@ptit.edu.vn", "Academic Staff", UserRole.STAFF);
            User lecturerUser = ensureUser(userRepository, passwordEncoder, "lect01", "lect01@ptit.edu.vn", "Lecturer One", UserRole.LECTURER);
            User studentUser = ensureUser(userRepository, passwordEncoder, "sv001", "sv001@ptit.edu.vn", "Student One", UserRole.STUDENT);
            User facilityUser = ensureUser(userRepository, passwordEncoder, "fac01", "fac01@ptit.edu.vn", "Facility One", UserRole.FACILITY);

            if (lecturerRepository.findByUserId(lecturerUser.getId()).isEmpty()) {
                Lecturer lecturer = new Lecturer();
                lecturer.setUserId(lecturerUser.getId());
                lecturer.setDepartmentId(1);
                lecturer.setStaffCode("LECT001");
                lecturer.setFullName("Lecturer One");
                lecturer.setEmail("lect01@ptit.edu.vn");
                lecturer.setPhone("0900000001");
                lecturer.setDeleted(false);
                lecturerRepository.save(lecturer);
            }

            if (studentRepository.findByUserId(studentUser.getId()).isEmpty()) {
                Student student = new Student();
                student.setUserId(studentUser.getId());
                student.setFacultyId(1);
                student.setStudentCode("B21DCCN001");
                student.setClassName("D21CQCN01-B");
                student.setCourseYear((short) 2021);
                student.setPhone("0900000002");
                student.setDeleted(false);
                studentRepository.save(student);
            }

            if (facilityStaffRepository.findByUserId(facilityUser.getId()).isEmpty()) {
                FacilityStaff facilityStaff = new FacilityStaff();
                facilityStaff.setUserId(facilityUser.getId());
                facilityStaff.setStaffCode("FAC001");
                facilityStaff.setBuildingId(1);
                facilityStaff.setNote("Default facility test account");
                facilityStaff.setDeleted(false);
                facilityStaffRepository.save(facilityStaff);
            }
        };
    }

    private User ensureUser(UserRepository userRepository,
                            PasswordEncoder passwordEncoder,
                            String username,
                            String email,
                            String fullName,
                            UserRole role) {
        return userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername(username);
                    user.setEmail(email);
                    user.setFullName(fullName);
                    user.setRole(role);
                    user.setActive(true);
                    user.setDeleted(false);
                    user.setPasswordHash(passwordEncoder.encode("123456"));
                    return userRepository.save(user);
                });
    }
}
