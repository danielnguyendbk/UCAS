package com.ptit.qlphonghoc.auth.service;

import com.ptit.qlphonghoc.audit.service.AuditLogService;
import com.ptit.qlphonghoc.auth.dto.ChangePasswordRequest;
import com.ptit.qlphonghoc.auth.dto.CurrentUserResponse;
import com.ptit.qlphonghoc.auth.dto.FacilityProfileResponse;
import com.ptit.qlphonghoc.auth.dto.ForgotPasswordRequest;
import com.ptit.qlphonghoc.auth.dto.LecturerProfileResponse;
import com.ptit.qlphonghoc.auth.dto.LoginRequest;
import com.ptit.qlphonghoc.auth.dto.LoginResponse;
import com.ptit.qlphonghoc.auth.dto.ResetPasswordRequest;
import com.ptit.qlphonghoc.auth.dto.StudentProfileResponse;
import com.ptit.qlphonghoc.auth.dto.UpdateProfileRequest;
import com.ptit.qlphonghoc.auth.dto.UserSummaryResponse;
import com.ptit.qlphonghoc.auth.jwt.JwtService;
import com.ptit.qlphonghoc.auth.security.CustomUserDetails;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final LecturerRepository lecturerRepository;
    private final StudentRepository studentRepository;
    private final FacilityStaffRepository facilityStaffRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.mail.from:no-reply@ucas.local}")
    private String mailFrom;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    public AuthService(UserRepository userRepository,
                       LecturerRepository lecturerRepository,
                       StudentRepository studentRepository,
                       FacilityStaffRepository facilityStaffRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditLogService auditLogService,
                       JdbcTemplate jdbcTemplate,
                       ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.userRepository = userRepository;
        this.lecturerRepository = lecturerRepository;
        this.studentRepository = studentRepository;
        this.facilityStaffRepository = facilityStaffRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
        this.jdbcTemplate = jdbcTemplate;
        this.mailSenderProvider = mailSenderProvider;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!user.isActive()) {
            throw new InactiveAccountException("Account is inactive");
        }

        if (!matchesPassword(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        if (isLegacyPlainPassword(user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
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
        User user = userRepository.findByUsername(username)
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

    @Transactional
    public UserSummaryResponse updateCurrentUser(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new InactiveAccountException("Account is inactive");
        }

        String fullName = normalizeFullName(request);
        String email = normalize(request == null ? null : request.email());

        if (fullName.isBlank()) {
            throw new BadRequestException("Full name is required");
        }
        if (email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (userRepository.existsByEmailAndIdNot(email, user.getId())) {
            throw new BadRequestException("Email is already used by another account");
        }

        user.setEmail(email);
        user.setFullName(fullName);
        userRepository.save(user);
        updateFullNameIfColumnExists(user.getId(), fullName);

        return toUserSummary(user);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        String currentPassword = normalize(request == null ? null : request.currentPassword());
        String newPassword = normalize(request == null ? null : request.newPassword());
        String confirmPassword = normalize(request == null ? null : request.confirmPassword());

        validatePasswordChange(currentPassword, newPassword, confirmPassword);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new InactiveAccountException("Account is inactive");
        }

        if (!matchesPassword(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = normalize(request == null ? null : request.email());
        if (email.isBlank()) {
            throw new BadRequestException("Email is required");
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return;
        }

        User user = userOptional.get();
        if (!user.isActive()) {
            throw new InactiveAccountException("Account is inactive");
        }

        ensurePasswordResetTokenTable();

        String rawToken = generateSecureToken();
        String tokenHash = sha256(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);

        jdbcTemplate.update(
                "UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL",
                LocalDateTime.now(),
                user.getId());

        jdbcTemplate.update(
                "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at) VALUES (?, ?, ?, NULL)",
                user.getId(),
                tokenHash,
                expiresAt);

        String resetLink = frontendBaseUrl.replaceAll("/+$", "") + "/login?resetToken=" + rawToken;
        sendResetPasswordEmail(user.getEmail(), toUserSummary(user).fullName(), resetLink);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = normalize(request == null ? null : request.token());
        String newPassword = normalize(request == null ? null : request.newPassword());
        String confirmPassword = normalize(request == null ? null : request.confirmPassword());

        if (token.isBlank()) {
            throw new BadRequestException("Reset token is invalid");
        }
        validateNewPassword(newPassword, confirmPassword);

        ensurePasswordResetTokenTable();

        String tokenHash = sha256(token);
        List<Map<String, Object>> tokens = jdbcTemplate.queryForList(
                "SELECT * FROM password_reset_tokens WHERE token_hash = ? LIMIT 1",
                tokenHash);

        if (tokens.isEmpty()) {
            throw new BadRequestException("Reset link is invalid");
        }

        Map<String, Object> resetToken = tokens.get(0);
        if (resetToken.get("used_at") != null) {
            throw new BadRequestException("Reset link has already been used");
        }

        LocalDateTime expiresAt = toLocalDateTime(resetToken.get("expires_at"));
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset link has expired");
        }

        Integer userId = toInteger(resetToken.get("user_id"));
        if (userId == null) {
            throw new BadRequestException("Reset link is invalid");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new InactiveAccountException("Account is inactive");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        jdbcTemplate.update(
                "UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ?",
                LocalDateTime.now(),
                tokenHash);
    }

    private UserSummaryResponse toUserSummary(User user) {
        String fullName = readFullNameFromUsersTable(user.getId()).orElse(user.getFullName());
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                fullName,
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

    private String normalizeFullName(UpdateProfileRequest request) {
        if (request == null) {
            return "";
        }
        String fullName = normalize(request.fullName());
        if (!fullName.isBlank()) {
            return fullName;
        }
        return normalize(request.full_name());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private void validatePasswordChange(String currentPassword, String newPassword, String confirmPassword) {
        if (currentPassword.isBlank() || newPassword.isBlank() || confirmPassword.isBlank()) {
            throw new BadRequestException("Current password, new password and confirmation are required");
        }
        validateNewPassword(newPassword, confirmPassword);
        if (currentPassword.equals(newPassword)) {
            throw new BadRequestException("New password must be different from current password");
        }
    }

    private void validateNewPassword(String newPassword, String confirmPassword) {
        if (newPassword.isBlank() || confirmPassword.isBlank()) {
            throw new BadRequestException("New password and confirmation are required");
        }
        if (newPassword.length() < 6) {
            throw new BadRequestException("New password must contain at least 6 characters");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new BadRequestException("Password confirmation does not match");
        }
    }

    private boolean matchesPassword(String rawPassword, String storedPassword) {
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }
        if (isLegacyPlainPassword(storedPassword)) {
            return rawPassword.equals(storedPassword);
        }
        return passwordEncoder.matches(rawPassword, storedPassword);
    }

    private boolean isLegacyPlainPassword(String storedPassword) {
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }
        return !(storedPassword.startsWith("$2a$")
                || storedPassword.startsWith("$2b$")
                || storedPassword.startsWith("$2y$"));
    }

    private void ensurePasswordResetTokenTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    token_id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    token_hash VARCHAR(64) NOT NULL UNIQUE,
                    expires_at DATETIME NOT NULL,
                    used_at DATETIME NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_password_reset_tokens_user_id (user_id),
                    INDEX idx_password_reset_tokens_token_hash (token_hash)
                )
                """);
    }

    private void sendResetPasswordEmail(String to, String fullName, String resetLink) {
        if (!mailEnabled) {
            log.info("Password reset link for {}: {}", to, resetLink);
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("Mail sending is enabled but JavaMailSender is not configured. Reset link for {}: {}", to, resetLink);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(to);
            message.setSubject("UCAS - Reset password");
            message.setText("""
                    Hello %s,

                    We received a request to reset your UCAS account password.

                    Please open this link to reset your password:
                    %s

                    This link is valid for 30 minutes and can be used only once.

                    If you did not request this, please ignore this email.
                    """.formatted(fullName == null || fullName.isBlank() ? "user" : fullName, resetLink));
            mailSender.send(message);
        } catch (MailException exception) {
            throw new BadRequestException("Could not send reset password email: " + exception.getMessage());
        }
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedHash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedHash);
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot hash token", exception);
        }
    }

    private Optional<String> readFullNameFromUsersTable(Integer userId) {
        if (userId == null) {
            return Optional.empty();
        }
        Optional<String> lecturerName = querySingleString(
                "SELECT full_name FROM lecturers WHERE user_id = ? AND is_deleted = 0 LIMIT 1",
                userId);
        if (lecturerName.isPresent()) {
            return lecturerName;
        }
        Optional<String> studentCode = querySingleString(
                "SELECT student_code FROM students WHERE user_id = ? AND is_deleted = 0 LIMIT 1",
                userId);
        if (studentCode.isPresent()) {
            return studentCode;
        }
        Optional<String> facilityCode = querySingleString(
                "SELECT staff_code FROM facility_staff WHERE user_id = ? AND is_deleted = 0 LIMIT 1",
                userId);
        if (facilityCode.isPresent()) {
            return facilityCode;
        }
        return Optional.empty();
    }

    private Optional<String> querySingleString(String sql, Object... args) {
        try {
            List<String> values = jdbcTemplate.queryForList(sql, String.class, args);
            if (values.isEmpty() || values.get(0) == null || values.get(0).isBlank()) {
                return Optional.empty();
            }
            return Optional.of(values.get(0));
        } catch (DataAccessException exception) {
            return Optional.empty();
        }
    }

    private void updateFullNameIfColumnExists(Integer userId, String fullName) {
        if (userId == null || fullName == null || fullName.isBlank()) {
            return;
        }
        try {
            jdbcTemplate.update(
                    "UPDATE lecturers SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_deleted = 0",
                    fullName,
                    userId);
        } catch (DataAccessException ignored) {
            // The current schema stores display names only in role-specific profile tables.
        }
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return null;
    }

    private Integer toInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return value == null ? null : Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
