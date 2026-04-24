package com.ptit.qlphonghoc.auth.service;

import com.ptit.qlphonghoc.audit.service.AuditLogService;
import com.ptit.qlphonghoc.auth.dto.CurrentUserResponse;
import com.ptit.qlphonghoc.auth.dto.FacilityProfileResponse;
import com.ptit.qlphonghoc.auth.dto.LecturerProfileResponse;
import com.ptit.qlphonghoc.auth.dto.LoginRequest;
import com.ptit.qlphonghoc.auth.dto.LoginResponse;
import com.ptit.qlphonghoc.auth.dto.StudentProfileResponse;
import com.ptit.qlphonghoc.auth.dto.UserSummaryResponse;
import com.ptit.qlphonghoc.auth.jwt.JwtService;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.exception.InactiveAccountException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.common.exception.UserProfileInconsistentException;
import com.ptit.qlphonghoc.facility.entity.FacilityStaff;
import com.ptit.qlphonghoc.facility.repository.FacilityStaffRepository;
import com.ptit.qlphonghoc.lecturer.entity.Lecturer;
import com.ptit.qlphonghoc.lecturer.repository.LecturerRepository;
import com.ptit.qlphonghoc.student.entity.Student;
import com.ptit.qlphonghoc.student.repository.StudentRepository;
import com.ptit.qlphonghoc.user.entity.User;
import com.ptit.qlphonghoc.user.enumtype.UserRole;
import com.ptit.qlphonghoc.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final LecturerRepository lecturerRepository;
    private final StudentRepository studentRepository;
    private final FacilityStaffRepository facilityStaffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository,
                       LecturerRepository lecturerRepository,
                       StudentRepository studentRepository,
                       FacilityStaffRepository facilityStaffRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.lecturerRepository = lecturerRepository;
        this.studentRepository = studentRepository;
        this.facilityStaffRepository = facilityStaffRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByUsernameAndIsDeletedFalse(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!user.isActive()) {
            throw new InactiveAccountException("Account is inactive");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateToken(userDetails);
        Object profile = resolveProfile(user);
        auditLogService.logLogin(user, extractClientIp(httpRequest));

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtService.getExpiration(),
                toUserSummary(user),
                profile,
                permissions(user),
                redirectPath(user.getRole())
        );
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new InactiveAccountException("Account is inactive");
        }

        return new CurrentUserResponse(
                toUserSummary(user),
                resolveProfile(user),
                permissions(user),
                redirectPath(user.getRole())
        );
    }

    private UserSummaryResponse toUserSummary(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive()
        );
    }

    private List<String> permissions(User user) {
        return List.of("ROLE_" + user.getRole().name());
    }

    private String redirectPath(UserRole role) {
        return switch (role) {
            case ADMIN -> "/admin";
            case STAFF -> "/staff";
            case LECTURER -> "/lecturer";
            case STUDENT -> "/student";
            case FACILITY -> "/facility";
        };
    }

    private Object resolveProfile(User user) {
        return switch (user.getRole()) {
            case ADMIN, STAFF -> null;
            case LECTURER -> mapLecturerProfile(user.getId());
            case STUDENT -> mapStudentProfile(user.getId());
            case FACILITY -> mapFacilityProfile(user.getId());
        };
    }

    private LecturerProfileResponse mapLecturerProfile(Integer userId) {
        Lecturer lecturer = lecturerRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new UserProfileInconsistentException("User profile data is inconsistent"));
        return new LecturerProfileResponse(
                lecturer.getId(),
                lecturer.getStaffCode(),
                lecturer.getDepartmentId(),
                lecturer.getFullName(),
                lecturer.getEmail(),
                lecturer.getPhone()
        );
    }

    private StudentProfileResponse mapStudentProfile(Integer userId) {
        Student student = studentRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new UserProfileInconsistentException("User profile data is inconsistent"));
        return new StudentProfileResponse(
                student.getId(),
                student.getStudentCode(),
                student.getFacultyId(),
                student.getClassName(),
                student.getCourseYear(),
                student.getPhone()
        );
    }

    private FacilityProfileResponse mapFacilityProfile(Integer userId) {
        FacilityStaff facilityStaff = facilityStaffRepository.findByUserId(userId)
                .filter(profile -> !profile.isDeleted())
                .orElseThrow(() -> new UserProfileInconsistentException("User profile data is inconsistent"));
        return new FacilityProfileResponse(
                facilityStaff.getId(),
                facilityStaff.getStaffCode(),
                facilityStaff.getBuildingId(),
                facilityStaff.getNote()
        );
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
