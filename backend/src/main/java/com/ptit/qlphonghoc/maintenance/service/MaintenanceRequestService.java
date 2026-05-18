package com.ptit.qlphonghoc.maintenance.service;

import com.ptit.qlphonghoc.maintenance.dto.CreateMaintenanceRequest;
import com.ptit.qlphonghoc.maintenance.dto.MaintenanceRequestResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class MaintenanceRequestService {

    private static final Set<String> ISSUE_CATEGORIES = Set.of(
            "PROJECTOR",
            "AIR_CONDITIONER",
            "LIGHT",
            "FAN",
            "DOOR",
            "DESK_CHAIR",
            "ELECTRICAL",
            "NETWORK",
            "CLEANLINESS",
            "OTHER"
    );

    private static final Set<String> SEVERITY_LEVELS = Set.of(
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT"
    );

    private static final Set<String> STATUSES = Set.of(
            "PENDING",
            "IN_PROGRESS",
            "RESOLVED",
            "REJECTED"
    );

    private static final Set<String> STAFF_UPDATE_STATUSES = Set.of(
            "IN_PROGRESS",
            "RESOLVED",
            "REJECTED"
    );

    private final JdbcTemplate jdbcTemplate;

    public MaintenanceRequestService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public MaintenanceRequestResponse create(CreateMaintenanceRequest request, Integer reporterUserId) {
        Classroom classroom = findReportableRoom(request.roomCode());
        String category = normalizeEnum(request.issueCategory(), ISSUE_CATEGORIES, "issueCategory");
        String severity = normalizeEnum(request.severityLevel(), SEVERITY_LEVELS, "severityLevel");
        String description = normalizeRequired(request.description(), "description");
        String imageUrl = normalizeBlank(request.imageUrl());
        String issueTitle = normalizeTitle(request.issueTitle(), category, classroom.roomCode());

        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            jdbcTemplate.update(connection -> {
                PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO classroom_issue_reports (
                        classroom_id,
                        reporter_user_id,
                        issue_title,
                        issue_category,
                        severity_level,
                        description,
                        image_url,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
                    """, Statement.RETURN_GENERATED_KEYS);
                statement.setInt(1, classroom.id());
                statement.setInt(2, reporterUserId);
                statement.setString(3, issueTitle);
                statement.setString(4, category);
                statement.setString(5, severity);
                statement.setString(6, description);
                statement.setString(7, imageUrl);
                return statement;
            }, keyHolder);
        } catch (DataAccessException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    resolveDataAccessMessage(exception, "Khong tao duoc yeu cau sua chua."),
                    exception
            );
        }

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong lay duoc ma yeu cau sua chua.");
        }
        return findById(key.intValue(), reporterUserId);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRequestResponse> getMyRequests(Integer reporterUserId) {
        return jdbcTemplate.query("""
            SELECT
                cir.id AS id,
                cir.issue_title AS issueTitle,
                cir.issue_category AS issueCategory,
                cir.severity_level AS severityLevel,
                cir.description AS description,
                cir.image_url AS imageUrl,
                cir.status AS status,
                CONCAT(b.code, '-', cr.room_number) AS roomCode,
                cr.room_name AS roomName,
                b.name AS buildingName,
                reporter.full_name AS reporterName,
                handler.full_name AS handledByName,
                cir.resolution_note AS resolutionNote,
                cir.created_at AS createdAt,
                cir.handled_at AS handledAt
            FROM classroom_issue_reports cir
            JOIN classrooms cr ON cr.id = cir.classroom_id
            JOIN buildings b ON b.id = cr.building_id
            JOIN users reporter ON reporter.id = cir.reporter_user_id
            LEFT JOIN users handler ON handler.id = cir.handled_by
            WHERE cir.reporter_user_id = ?
              AND cir.is_deleted = FALSE
            ORDER BY cir.created_at DESC
            """, responseMapper(), reporterUserId);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRequestResponse> getAllRequests(String status) {
        String normalizedStatus = normalizeOptionalStatus(status);
        if (normalizedStatus == null) {
            return jdbcTemplate.query("""
                SELECT
                    cir.id AS id,
                    cir.issue_title AS issueTitle,
                    cir.issue_category AS issueCategory,
                    cir.severity_level AS severityLevel,
                    cir.description AS description,
                    cir.image_url AS imageUrl,
                    cir.status AS status,
                    CONCAT(b.code, '-', cr.room_number) AS roomCode,
                    cr.room_name AS roomName,
                    b.name AS buildingName,
                    reporter.full_name AS reporterName,
                    handler.full_name AS handledByName,
                    cir.resolution_note AS resolutionNote,
                    cir.created_at AS createdAt,
                    cir.handled_at AS handledAt
                FROM classroom_issue_reports cir
                JOIN classrooms cr ON cr.id = cir.classroom_id
                JOIN buildings b ON b.id = cr.building_id
                JOIN users reporter ON reporter.id = cir.reporter_user_id
                LEFT JOIN users handler ON handler.id = cir.handled_by
                WHERE cir.is_deleted = FALSE
                ORDER BY
                    CASE cir.status
                        WHEN 'PENDING' THEN 0
                        WHEN 'IN_PROGRESS' THEN 1
                        WHEN 'REJECTED' THEN 2
                        WHEN 'RESOLVED' THEN 3
                        ELSE 4
                    END,
                    cir.created_at DESC
                """, responseMapper());
        }

        return jdbcTemplate.query("""
            SELECT
                cir.id AS id,
                cir.issue_title AS issueTitle,
                cir.issue_category AS issueCategory,
                cir.severity_level AS severityLevel,
                cir.description AS description,
                cir.image_url AS imageUrl,
                cir.status AS status,
                CONCAT(b.code, '-', cr.room_number) AS roomCode,
                cr.room_name AS roomName,
                b.name AS buildingName,
                reporter.full_name AS reporterName,
                handler.full_name AS handledByName,
                cir.resolution_note AS resolutionNote,
                cir.created_at AS createdAt,
                cir.handled_at AS handledAt
            FROM classroom_issue_reports cir
            JOIN classrooms cr ON cr.id = cir.classroom_id
            JOIN buildings b ON b.id = cr.building_id
            JOIN users reporter ON reporter.id = cir.reporter_user_id
            LEFT JOIN users handler ON handler.id = cir.handled_by
            WHERE cir.is_deleted = FALSE
              AND cir.status = ?
            ORDER BY cir.created_at DESC
            """, responseMapper(), normalizedStatus);
    }

    @Transactional
    public MaintenanceRequestResponse updateStatus(
            Integer id,
            String status,
            String resolutionNote,
            Integer handlerUserId
    ) {
        String normalizedStatus = normalizeEnum(status, STAFF_UPDATE_STATUSES, "status");
        String note = normalizeBlank(resolutionNote);
        if ((normalizedStatus.equals("RESOLVED") || normalizedStatus.equals("REJECTED")) && note == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resolutionNote is required.");
        }

        try {
            int updated = jdbcTemplate.update("""
                UPDATE classroom_issue_reports
                   SET status = ?,
                       handled_by = ?,
                       handled_at = CURRENT_TIMESTAMP,
                       resolution_note = ?
                 WHERE id = ?
                   AND is_deleted = FALSE
                """, normalizedStatus, handlerUserId, note, id);

            if (updated == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay yeu cau sua chua.");
            }
        } catch (DataAccessException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    resolveDataAccessMessage(exception, "Khong cap nhat duoc yeu cau sua chua."),
                    exception
            );
        }

        return findByIdForStaff(id);
    }

    private MaintenanceRequestResponse findById(Integer id, Integer reporterUserId) {
        List<MaintenanceRequestResponse> responses = jdbcTemplate.query("""
            SELECT
                cir.id AS id,
                cir.issue_title AS issueTitle,
                cir.issue_category AS issueCategory,
                cir.severity_level AS severityLevel,
                cir.description AS description,
                cir.image_url AS imageUrl,
                cir.status AS status,
                CONCAT(b.code, '-', cr.room_number) AS roomCode,
                cr.room_name AS roomName,
                b.name AS buildingName,
                reporter.full_name AS reporterName,
                handler.full_name AS handledByName,
                cir.resolution_note AS resolutionNote,
                cir.created_at AS createdAt,
                cir.handled_at AS handledAt
            FROM classroom_issue_reports cir
            JOIN classrooms cr ON cr.id = cir.classroom_id
            JOIN buildings b ON b.id = cr.building_id
            JOIN users reporter ON reporter.id = cir.reporter_user_id
            LEFT JOIN users handler ON handler.id = cir.handled_by
            WHERE cir.id = ?
              AND cir.reporter_user_id = ?
              AND cir.is_deleted = FALSE
            """, responseMapper(), id, reporterUserId);

        if (responses.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay yeu cau sua chua.");
        }
        return responses.get(0);
    }

    private MaintenanceRequestResponse findByIdForStaff(Integer id) {
        List<MaintenanceRequestResponse> responses = jdbcTemplate.query("""
            SELECT
                cir.id AS id,
                cir.issue_title AS issueTitle,
                cir.issue_category AS issueCategory,
                cir.severity_level AS severityLevel,
                cir.description AS description,
                cir.image_url AS imageUrl,
                cir.status AS status,
                CONCAT(b.code, '-', cr.room_number) AS roomCode,
                cr.room_name AS roomName,
                b.name AS buildingName,
                reporter.full_name AS reporterName,
                handler.full_name AS handledByName,
                cir.resolution_note AS resolutionNote,
                cir.created_at AS createdAt,
                cir.handled_at AS handledAt
            FROM classroom_issue_reports cir
            JOIN classrooms cr ON cr.id = cir.classroom_id
            JOIN buildings b ON b.id = cr.building_id
            JOIN users reporter ON reporter.id = cir.reporter_user_id
            LEFT JOIN users handler ON handler.id = cir.handled_by
            WHERE cir.id = ?
              AND cir.is_deleted = FALSE
            """, responseMapper(), id);

        if (responses.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay yeu cau sua chua.");
        }
        return responses.get(0);
    }

    private Classroom findReportableRoom(String rawRoomCode) {
        String roomCode = normalizeRoomCode(rawRoomCode);
        if (roomCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomCode is required.");
        }

        List<Classroom> rooms = jdbcTemplate.query("""
            SELECT
                cr.id AS classroomId,
                CONCAT(b.code, '-', cr.room_number) AS roomCode,
                cr.room_name AS roomName
            FROM classrooms cr
            JOIN buildings b ON b.id = cr.building_id
            WHERE cr.is_active = TRUE
              AND (
                  UPPER(REPLACE(REPLACE(CONCAT(b.code, '-', cr.room_number), '-', ''), ' ', '')) = ?
                  OR UPPER(REPLACE(REPLACE(cr.room_number, '-', ''), ' ', '')) = ?
              )
            ORDER BY
                cr.id
            LIMIT 1
            """, (rs, rowNum) -> new Classroom(
                rs.getInt("classroomId"),
                rs.getString("roomCode"),
                rs.getString("roomName")
        ), roomCode, roomCode);

        if (rooms.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Khong tim thay phong hoc theo ma: " + rawRoomCode
            );
        }
        return rooms.get(0);
    }

    private RowMapper<MaintenanceRequestResponse> responseMapper() {
        return (rs, rowNum) -> new MaintenanceRequestResponse(
                rs.getInt("id"),
                "SC-" + String.format("%06d", rs.getInt("id")),
                rs.getString("issueTitle"),
                rs.getString("issueCategory"),
                rs.getString("severityLevel"),
                rs.getString("description"),
                rs.getString("imageUrl"),
                rs.getString("status"),
                rs.getString("roomCode"),
                rs.getString("roomName"),
                rs.getString("buildingName"),
                rs.getString("reporterName"),
                rs.getString("handledByName"),
                rs.getString("resolutionNote"),
                rs.getObject("createdAt", LocalDateTime.class),
                rs.getObject("handledAt", LocalDateTime.class)
        );
    }

    private String normalizeEnum(String value, Set<String> allowedValues, String fieldName) {
        String normalized = normalizeRequired(value, fieldName).toUpperCase(Locale.ROOT);
        if (!allowedValues.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is invalid: " + value);
        }
        return normalized;
    }

    private String normalizeOptionalStatus(String status) {
        String normalized = normalizeBlank(status);
        if (normalized == null || normalized.equalsIgnoreCase("ALL")) {
            return null;
        }
        normalized = normalized.toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is invalid: " + status);
        }
        return normalized;
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
        return value.trim();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeRoomCode(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("-", "")
                .replace(" ", "")
                .trim()
                .toUpperCase(Locale.ROOT);
    }

    private String normalizeTitle(String rawTitle, String category, String roomCode) {
        String title = normalizeBlank(rawTitle);
        if (title == null) {
            title = "Bao cao su co " + category + " tai " + roomCode;
        }
        if (title.length() > 200) {
            return title.substring(0, 200);
        }
        return title;
    }

    private String resolveDataAccessMessage(DataAccessException exception, String fallback) {
        Throwable cause = exception.getRootCause();
        if (cause != null && cause.getMessage() != null && !cause.getMessage().isBlank()) {
            return cause.getMessage();
        }
        return fallback;
    }

    private record Classroom(Integer id, String roomCode, String roomName) {
    }
}
