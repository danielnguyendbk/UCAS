package com.ptit.qlphonghoc.facility.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ptit.qlphonghoc.audit.enumtype.AuditAction;
import com.ptit.qlphonghoc.common.exception.BadRequestException;
import com.ptit.qlphonghoc.common.exception.ResourceNotFoundException;
import com.ptit.qlphonghoc.facility.dto.FacilityAssignmentResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityAssignmentStatus;
import com.ptit.qlphonghoc.facility.dto.FacilityAssignmentStatusRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityAssignmentUpsertRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityIssueReportCreateRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityIssueReportResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityMyAssignmentResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningActionRequest;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningScheduleItemResponse;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningSourceType;
import com.ptit.qlphonghoc.facility.dto.FacilityOpeningStatus;
import com.ptit.qlphonghoc.facility.entity.FacilityBuildingAssignment;
import com.ptit.qlphonghoc.facility.repository.FacilityBuildingAssignmentRepository;
import com.ptit.qlphonghoc.facility.repository.FacilityStaffRepository;
import com.ptit.qlphonghoc.staff.dto.allocation.PageResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FacilityWorkflowService {

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

    private final NamedParameterJdbcTemplate namedJdbc;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final FacilityStaffRepository facilityStaffRepository;
    private final FacilityBuildingAssignmentRepository assignmentRepository;

    public FacilityWorkflowService(
            NamedParameterJdbcTemplate namedJdbc,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            FacilityStaffRepository facilityStaffRepository,
            FacilityBuildingAssignmentRepository assignmentRepository
    ) {
        this.namedJdbc = namedJdbc;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.facilityStaffRepository = facilityStaffRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<FacilityAssignmentResponse> listAssignments(
            Integer semesterId,
            String search,
            String status,
            Integer page,
            Integer size
    ) {
        String normalizedSearch = normalizeBlank(search);
        FacilityAssignmentStatus normalizedStatus = normalizeAssignmentStatus(status);
        Integer resolvedSemesterId = semesterId;

        StringBuilder sql = new StringBuilder("""
            SELECT
                a.assignment_id AS id,
                a.semester_id AS semesterId,
                sem.semester_code AS semesterCode,
                sem.semester_name AS semesterName,
                a.facility_staff_id AS facilityStaffId,
                fs.staff_code AS staffCode,
                u.username AS username,
                a.building_id AS buildingId,
                b.building_code AS buildingCode,
                b.building_name AS buildingName,
                a.status AS status,
                a.note AS note,
                a.assigned_by AS assignedBy,
                creator.username AS assignedByUsername,
                a.assigned_at AS assignedAt,
                a.created_at AS createdAt,
                a.updated_at AS updatedAt
            FROM facility_building_assignments a
            JOIN facility_staff fs ON fs.facility_staff_id = a.facility_staff_id AND fs.is_deleted = FALSE
            JOIN users u ON u.user_id = fs.user_id
            JOIN semesters sem ON sem.semester_id = a.semester_id AND sem.is_deleted = FALSE
            JOIN buildings b ON b.building_id = a.building_id AND b.is_deleted = FALSE
            LEFT JOIN users creator ON creator.user_id = a.assigned_by
            WHERE 1 = 1
            """);

        MapSqlParameterSource params = new MapSqlParameterSource();
        if (resolvedSemesterId != null) {
            sql.append(" AND a.semester_id = :semesterId");
            params.addValue("semesterId", resolvedSemesterId);
        }
        if (normalizedStatus != null) {
            sql.append(" AND a.status = :status");
            params.addValue("status", normalizedStatus.name());
        }
        if (normalizedSearch != null) {
            sql.append("""
                 AND (
                     LOWER(fs.staff_code) LIKE :search
                     OR LOWER(u.username) LIKE :search
                     OR LOWER(b.building_code) LIKE :search
                     OR LOWER(b.building_name) LIKE :search
                     OR LOWER(sem.semester_code) LIKE :search
                     OR LOWER(sem.semester_name) LIKE :search
                     OR LOWER(COALESCE(a.note, '')) LIKE :search
                 )
                """);
            params.addValue("search", "%" + normalizedSearch.toLowerCase(Locale.ROOT) + "%");
        }

        sql.append(" ORDER BY sem.semester_id DESC, fs.staff_code ASC, a.assignment_id DESC");

        List<FacilityAssignmentResponse> allItems = namedJdbc.query(sql.toString(), params, assignmentRowMapper());
        return pageResult(allItems, page, size);
    }

    @Transactional
    public FacilityAssignmentResponse createAssignment(FacilityAssignmentUpsertRequest request, Integer currentUserId) {
        validateAssignmentRequest(request);
        SemesterRef semester = findSemester(request.semesterId());
        FacilityStaffRef facilityStaff = findFacilityStaff(request.facilityStaffId());
        ensureFacilityRoleAndActive(facilityStaff);
        BuildingRef building = findBuilding(request.buildingId());

        if (existsAssignment(semester.id, facilityStaff.id)) {
            throw new BadRequestException(
                    "FACILITY_ASSIGNMENT_DUPLICATED",
                    "Nhân viên CSVC đã có phân công trong học kỳ này."
            );
        }

        FacilityAssignmentStatus status = request.status() == null ? FacilityAssignmentStatus.ACTIVE : request.status();
        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            namedJdbc.getJdbcTemplate().update(connection -> {
                PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO facility_building_assignments (
                        semester_id,
                        facility_staff_id,
                        building_id,
                        assigned_by,
                        assigned_at,
                        status,
                        note
                    )
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
                    """, Statement.RETURN_GENERATED_KEYS);
                statement.setLong(1, semester.id);
                statement.setLong(2, facilityStaff.id);
                statement.setLong(3, building.id);
                statement.setLong(4, currentUserId.longValue());
                statement.setString(5, status.name());
                statement.setString(6, normalizeBlank(request.note()));
                return statement;
            }, keyHolder);
        } catch (DuplicateKeyException exception) {
            throw new BadRequestException(
                    "FACILITY_ASSIGNMENT_DUPLICATED",
                    "Nhân viên CSVC đã có phân công trùng trong học kỳ này."
            );
        } catch (DataAccessException exception) {
            throw new BadRequestException(
                    "FACILITY_ASSIGNMENT_DUPLICATED",
                    resolveDataAccessMessage(exception, "Không tạo được phân công CSVC.")
            );
        }

        Number generatedId = keyHolder.getKey();
        if (generatedId == null) {
            throw new IllegalStateException("Cannot read generated assignment id");
        }
        return findAssignmentById(generatedId.longValue());
    }

    @Transactional
    public FacilityAssignmentResponse updateAssignment(
            Long assignmentId,
            FacilityAssignmentUpsertRequest request,
            Integer currentUserId
    ) {
        validateAssignmentRequest(request);
        FacilityAssignmentStatus status = request.status() == null ? FacilityAssignmentStatus.ACTIVE : request.status();
        SemesterRef semester = findSemester(request.semesterId());
        FacilityStaffRef facilityStaff = findFacilityStaff(request.facilityStaffId());
        ensureFacilityRoleAndActive(facilityStaff);
        BuildingRef building = findBuilding(request.buildingId());
        AssignmentRef current = findAssignmentReference(assignmentId);

        if (!current.semesterId.equals(semester.id) || !current.facilityStaffId.equals(facilityStaff.id)) {
            if (existsAssignment(semester.id, facilityStaff.id, assignmentId)) {
                throw new BadRequestException(
                        "FACILITY_ASSIGNMENT_DUPLICATED",
                        "Nhân viên CSVC đã có phân công trùng trong học kỳ này."
                );
            }
        }

        try {
            int updated = jdbcTemplate.update("""
                UPDATE facility_building_assignments
                   SET semester_id = ?,
                       facility_staff_id = ?,
                       building_id = ?,
                       assigned_by = ?,
                       assigned_at = CURRENT_TIMESTAMP,
                       status = ?,
                       note = ?,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE assignment_id = ?
                """,
                    semester.id,
                    facilityStaff.id,
                    building.id,
                    currentUserId,
                    status.name(),
                    normalizeBlank(request.note()),
                    assignmentId
            );

            if (updated == 0) {
                throw new ResourceNotFoundException(
                        "FACILITY_ASSIGNMENT_NOT_FOUND",
                        "Không tìm thấy phân công CSVC."
                );
            }
        } catch (DuplicateKeyException exception) {
            throw new BadRequestException(
                    "FACILITY_ASSIGNMENT_DUPLICATED",
                    "Nhân viên CSVC đã có phân công trùng trong học kỳ này."
            );
        } catch (DataAccessException exception) {
            throw new BadRequestException(
                    "FACILITY_ASSIGNMENT_DUPLICATED",
                    resolveDataAccessMessage(exception, "Không cập nhật được phân công CSVC.")
            );
        }

        return findAssignmentById(assignmentId);
    }

    @Transactional
    public FacilityAssignmentResponse updateAssignmentStatus(
            Long assignmentId,
            FacilityAssignmentStatusRequest request,
            Integer currentUserId
    ) {
        AssignmentRef current = findAssignmentReference(assignmentId);
        try {
            int updated = jdbcTemplate.update("""
                UPDATE facility_building_assignments
                   SET status = ?,
                       assigned_by = ?,
                       assigned_at = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP
                 WHERE assignment_id = ?
                """,
                    request.status().name(),
                    currentUserId,
                    assignmentId
            );
            if (updated == 0) {
                throw new ResourceNotFoundException(
                        "FACILITY_ASSIGNMENT_NOT_FOUND",
                        "Không tìm thấy phân công CSVC."
                );
            }
        } catch (DataAccessException exception) {
            throw new BadRequestException(
                    "FACILITY_ASSIGNMENT_DUPLICATED",
                    resolveDataAccessMessage(exception, "Không cập nhật được trạng thái phân công.")
            );
        }

        return findAssignmentById(current.id);
    }

    @Transactional(readOnly = true)
    public FacilityMyAssignmentResponse getMyAssignment(Integer userId, Integer semesterId) {
        SemesterRef semester = findSemesterOrActive(semesterId);
        FacilityStaffRef facilityStaff = findFacilityStaffByUserId(userId);
        AssignmentContext context = findActiveAssignmentContext(facilityStaff.id, semester.id);
        return new FacilityMyAssignmentResponse(
                context.assignmentId,
                semester.id,
                semester.code,
                semester.name,
                context.buildingId,
                context.buildingCode,
                context.buildingName,
                facilityStaff.id,
                facilityStaff.staffCode,
                context.status,
                context.note,
                context.assignedAt
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<FacilityOpeningScheduleItemResponse> getOpeningSchedule(
            Integer userId,
            Integer semesterId,
            LocalDate date,
            String search,
            String sourceType,
            String status,
            Integer page,
            Integer size
    ) {
        SemesterRef semester = findSemesterOrActive(semesterId);
        FacilityStaffRef facilityStaff = findFacilityStaffByUserId(userId);
        AssignmentContext context = findActiveAssignmentContext(facilityStaff.id, semester.id);
        LocalDate targetDate = date == null ? LocalDate.now() : date;
        FacilityOpeningSourceType normalizedSourceType = normalizeSourceType(sourceType);
        FacilityOpeningStatus normalizedStatus = normalizeOpeningStatus(status);
        String normalizedSearch = normalizeBlank(search);

        List<SourceItem> items = new ArrayList<>();
        items.addAll(findClassSessionSources(semester.id, context.buildingId, targetDate));
        items.addAll(findBorrowRequestSources(semester.id, context.buildingId, targetDate));
        items.addAll(findExamSources(semester.id, context.buildingId, targetDate));

        Map<SourceKey, AuditState> auditStates = loadAuditStates(items);
        LocalDateTime now = LocalDateTime.now();

        List<FacilityOpeningScheduleItemResponse> mapped = items.stream()
                .map(item -> buildScheduleItem(item, auditStates.getOrDefault(item.key(), AuditState.empty()), now))
                .filter(item -> normalizedSourceType == null || item.sourceType() == normalizedSourceType)
                .filter(item -> normalizedStatus == null || item.status() == normalizedStatus)
                .filter(item -> {
                    if (normalizedSearch == null) return true;
                    String keyword = normalizedSearch.toLowerCase(Locale.ROOT);
                    return containsIgnoreCase(item.classroomCode(), keyword)
                            || containsIgnoreCase(item.title(), keyword)
                            || containsIgnoreCase(item.subtitle(), keyword);
                })
                .sorted(Comparator
                        .comparing(FacilityOpeningScheduleItemResponse::startTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(FacilityOpeningScheduleItemResponse::classroomCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(FacilityOpeningScheduleItemResponse::sourceType)
                        .thenComparing(FacilityOpeningScheduleItemResponse::sourceId))
                .toList();

        return pageResult(mapped, page, size);
    }

    @Transactional
    public FacilityOpeningScheduleItemResponse openRoom(
            Integer userId,
            FacilityOpeningActionRequest request
    ) {
        return handleRoomAction(userId, request, AuditAction.OPEN_ROOM);
    }

    @Transactional
    public FacilityOpeningScheduleItemResponse closeRoom(
            Integer userId,
            FacilityOpeningActionRequest request
    ) {
        return handleRoomAction(userId, request, AuditAction.CLOSE_ROOM);
    }

    @Transactional
    public FacilityIssueReportResponse createIssueReport(
            Integer userId,
            FacilityIssueReportCreateRequest request
    ) {
        validateIssueRequest(request);
        SemesterRef semester = findSemesterOrActive(request.semesterId());
        FacilityStaffRef facilityStaff = findFacilityStaffByUserId(userId);
        AssignmentContext assignment = findActiveAssignmentContext(facilityStaff.id, semester.id);
        ClassroomRef classroom = findClassroom(request.classroomId());
        if (!Objects.equals(classroom.buildingId, assignment.buildingId)) {
            throw new BadRequestException(
                    "FACILITY_BUILDING_FORBIDDEN",
                    "Phòng học không thuộc tòa nhà được phân công."
            );
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        try {
            namedJdbc.getJdbcTemplate().update(connection -> {
                PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO classroom_issue_reports (
                        classroom_id,
                        reporter_user_id,
                        issue_title,
                        issue_category,
                        severity_level,
                        description,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
                    """, Statement.RETURN_GENERATED_KEYS);
                statement.setLong(1, classroom.id);
                statement.setLong(2, userId);
                statement.setString(3, normalizeRequired(request.issueTitle(), "issueTitle"));
                statement.setString(4, normalizeEnum(request.issueCategory(), ISSUE_CATEGORIES, "issueCategory"));
                statement.setString(5, normalizeEnum(request.severityLevel(), SEVERITY_LEVELS, "severityLevel"));
                statement.setString(6, normalizeRequired(request.description(), "description"));
                return statement;
            }, keyHolder);
        } catch (DataAccessException exception) {
            throw new BadRequestException(
                    "BAD_REQUEST",
                    resolveDataAccessMessage(exception, "Không tạo được báo cáo sự cố.")
            );
        }

        Number generatedId = keyHolder.getKey();
        if (generatedId == null) {
            throw new IllegalStateException("Cannot read generated issue report id");
        }
        return new FacilityIssueReportResponse(
                generatedId.longValue(),
                classroom.id,
                normalizeRequired(request.issueTitle(), "issueTitle"),
                normalizeEnum(request.issueCategory(), ISSUE_CATEGORIES, "issueCategory"),
                normalizeEnum(request.severityLevel(), SEVERITY_LEVELS, "severityLevel"),
                normalizeRequired(request.description(), "description"),
                "PENDING",
                userId.longValue(),
                LocalDateTime.now()
        );
    }

    private FacilityOpeningScheduleItemResponse handleRoomAction(
            Integer userId,
            FacilityOpeningActionRequest request,
            AuditAction action
    ) {
        SemesterRef semester = findSemester(request.semesterId());
        FacilityStaffRef facilityStaff = findFacilityStaffByUserId(userId);
        AssignmentContext assignment = findActiveAssignmentContext(facilityStaff.id, semester.id);
        ClassroomRef classroom = findClassroom(request.classroomId());
        if (!Objects.equals(classroom.buildingId, assignment.buildingId)) {
            throw new BadRequestException(
                    "FACILITY_BUILDING_FORBIDDEN",
                    "Phòng học không thuộc tòa nhà được phân công."
            );
        }

        FacilityOpeningSourceType requestSourceType = normalizeSourceType(request.sourceType());
        SourceItem source = findOpeningSource(requestSourceType, request.sourceId(), semester.id, assignment.buildingId, classroom.id);
        if (source == null) {
            throw new ResourceNotFoundException(
                    "OPENING_SOURCE_NOT_FOUND",
                    "Không tìm thấy nguồn mở cửa phù hợp."
            );
        }

        if (!Objects.equals(source.classroomId(), classroom.id)) {
            throw new ResourceNotFoundException(
                    "OPENING_SOURCE_NOT_FOUND",
                    "Nguồn mở cửa không khớp phòng học."
            );
        }

        if (source.cancelled()) {
            throw new BadRequestException(
                    "OPENING_SOURCE_CANCELLED",
                    "Nguồn mở cửa đã bị hủy."
            );
        }

        AuditState state = loadAuditStates(List.of(source)).getOrDefault(source.key(), AuditState.empty());
        FacilityOpeningScheduleItemResponse preview = buildScheduleItem(source, state, LocalDateTime.now());

        if (action == AuditAction.OPEN_ROOM) {
            if (preview.status() == FacilityOpeningStatus.CLOSED) {
                throw new BadRequestException("ROOM_ALREADY_CLOSED", "Phòng đã được đóng.");
            }
            if (preview.status() == FacilityOpeningStatus.OPENED) {
                throw new BadRequestException("ROOM_ALREADY_OPENED", "Phòng đã được mở.");
            }
            if (!preview.canOpen()) {
                throw new BadRequestException("ROOM_NOT_OPENED", "Phòng đã quá giờ mở.");
            }
        } else {
            if (preview.status() == FacilityOpeningStatus.CLOSED) {
                throw new BadRequestException("ROOM_ALREADY_CLOSED", "Phòng đã được đóng.");
            }
            if (!preview.canClose()) {
                throw new BadRequestException("ROOM_NOT_OPENED", "Phòng chưa được mở.");
            }
        }

        LocalDateTime eventTime = LocalDateTime.now();
        Map<String, Object> newValues = new LinkedHashMap<>();
        newValues.put("sourceType", source.sourceType().name());
        newValues.put("sourceId", source.sourceId());
        newValues.put("semesterId", source.semesterId());
        newValues.put("buildingId", source.buildingId());
        newValues.put("classroomId", source.classroomId());
        newValues.put("classroomCode", source.classroomCode());
        if (action == AuditAction.OPEN_ROOM) {
            newValues.put("openedAt", eventTime.toString());
        } else {
            newValues.put("closedAt", eventTime.toString());
        }

        insertAuditLog(
                userId,
                action,
                source,
                newValues,
                action == AuditAction.OPEN_ROOM
                        ? "Nhân viên CSVC mở cửa phòng " + source.classroomCode()
                        : "Nhân viên CSVC đóng cửa phòng " + source.classroomCode()
        );

        Map<SourceKey, AuditState> refreshedStates = refreshAuditStates(source);
        return buildScheduleItem(source, refreshedStates.getOrDefault(source.key(), AuditState.empty()), eventTime);
    }

    private FacilityOpeningScheduleItemResponse buildScheduleItem(SourceItem item, AuditState state, LocalDateTime now) {
        if (item.cancelled()) {
            return new FacilityOpeningScheduleItemResponse(
                    item.sourceType(),
                    item.sourceId(),
                    item.semesterId(),
                    item.buildingId(),
                    item.buildingCode(),
                    item.classroomId(),
                    item.classroomCode(),
                    item.title(),
                    item.subtitle(),
                    item.accessDate(),
                    item.startTime(),
                    item.endTime(),
                    item.startTime().minusMinutes(15),
                    FacilityOpeningStatus.CANCELLED,
                    null,
                    null,
                    false,
                    false
            );
        }

        LocalDateTime openedAt = state.openedAt;
        LocalDateTime closedAt = state.closedAt;
        FacilityOpeningStatus status;
        if (closedAt != null) {
            status = FacilityOpeningStatus.CLOSED;
        } else if (openedAt != null) {
            status = FacilityOpeningStatus.OPENED;
        } else {
            LocalDateTime expectedOpenAt = LocalDateTime.of(item.accessDate(), item.startTime().minusMinutes(15));
            LocalDateTime endAt = LocalDateTime.of(item.accessDate(), item.endTime());
            if (now.isAfter(endAt)) {
                status = FacilityOpeningStatus.MISSED;
            } else if (now.isAfter(expectedOpenAt)) {
                status = FacilityOpeningStatus.LATE;
            } else {
                status = FacilityOpeningStatus.PENDING;
            }
        }

        boolean canOpen = status == FacilityOpeningStatus.PENDING || status == FacilityOpeningStatus.LATE;
        boolean canClose = status == FacilityOpeningStatus.OPENED;

        return new FacilityOpeningScheduleItemResponse(
                item.sourceType(),
                item.sourceId(),
                item.semesterId(),
                item.buildingId(),
                item.buildingCode(),
                item.classroomId(),
                item.classroomCode(),
                item.title(),
                item.subtitle(),
                item.accessDate(),
                item.startTime(),
                item.endTime(),
                item.startTime().minusMinutes(15),
                status,
                openedAt,
                closedAt,
                canOpen,
                canClose
        );
    }

    private Map<SourceKey, AuditState> loadAuditStates(List<SourceItem> items) {
        Map<SourceKey, AuditState> states = new HashMap<>();
        Map<FacilityOpeningSourceType, List<SourceItem>> grouped = items.stream()
                .collect(Collectors.groupingBy(SourceItem::sourceType));

        for (Map.Entry<FacilityOpeningSourceType, List<SourceItem>> entry : grouped.entrySet()) {
            List<Long> sourceIds = entry.getValue().stream().map(SourceItem::sourceId).distinct().toList();
            if (sourceIds.isEmpty()) {
                continue;
            }
            MapSqlParameterSource params = new MapSqlParameterSource()
                    .addValue("tableName", tableNameForSourceType(entry.getKey()))
                    .addValue("sourceIds", sourceIds);

            List<AuditRow> rows = namedJdbc.query("""
                SELECT
                    al.action AS action,
                    al.record_id AS recordId,
                    al.new_values AS newValues,
                    al.created_at AS createdAt
                FROM audit_logs al
                WHERE al.table_name = :tableName
                  AND al.record_id IN (:sourceIds)
                  AND al.action IN ('OPEN_ROOM', 'CLOSE_ROOM')
                ORDER BY al.created_at ASC, al.audit_log_id ASC
                """, params, auditRowMapper());

            for (AuditRow row : rows) {
                SourceAuditPayload payload = parseAuditPayload(row.newValues);
                if (payload == null || payload.sourceType() == null || payload.sourceId() == null || payload.classroomId() == null) {
                    continue;
                }
                SourceKey key = new SourceKey(payload.sourceType(), payload.sourceId(), payload.classroomId());
                AuditState state = states.computeIfAbsent(key, ignored -> AuditState.empty());
                if (row.action == AuditAction.OPEN_ROOM && state.openedAt == null) {
                    state.openedAt = row.createdAt;
                }
                if (row.action == AuditAction.CLOSE_ROOM) {
                    state.closedAt = row.createdAt;
                }
            }
        }
        return states;
    }

    private SourceItem findOpeningSource(
            FacilityOpeningSourceType sourceType,
            Long sourceId,
            Integer semesterId,
            Long buildingId,
            Long classroomId
    ) {
        return switch (sourceType) {
            case CLASS_SESSION -> findClassSessionSource(sourceId, semesterId, buildingId, classroomId);
            case BORROW_REQUEST -> findBorrowRequestSource(sourceId, semesterId, buildingId, classroomId);
            case EXAM -> findExamSource(sourceId, semesterId, buildingId, classroomId);
        };
    }

    private SourceItem findClassSessionSource(Long sourceId, Integer semesterId, Long buildingId, Long classroomId) {
        List<SourceItem> items = namedJdbc.query("""
            SELECT
                'CLASS_SESSION' AS sourceType,
                cs.class_session_id AS sourceId,
                sec.semester_id AS semesterId,
                b.building_id AS buildingId,
                b.building_code AS buildingCode,
                cr.classroom_id AS classroomId,
                cr.classroom_code AS classroomCode,
                c.course_name AS title,
                sec.section_code AS subtitle,
                cs.session_date AS accessDate,
                cs.start_time AS startTime,
                cs.end_time AS endTime,
                cs.session_status AS sourceStatus
            FROM class_sessions cs
            JOIN classrooms cr ON cr.classroom_id = cs.classroom_id AND cr.is_deleted = FALSE
            JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            JOIN class_sections sec ON sec.section_id = cs.section_id
            JOIN courses c ON c.course_id = sec.course_id
            WHERE cs.class_session_id = :sourceId
              AND sec.semester_id = :semesterId
              AND b.building_id = :buildingId
              AND cr.classroom_id = :classroomId
            """,
                new MapSqlParameterSource()
                        .addValue("sourceId", sourceId)
                        .addValue("semesterId", semesterId)
                        .addValue("buildingId", buildingId)
                        .addValue("classroomId", classroomId),
                sourceItemRowMapper(FacilityOpeningSourceType.CLASS_SESSION)
        );
        return items.isEmpty() ? null : items.get(0);
    }

    private SourceItem findBorrowRequestSource(Long sourceId, Integer semesterId, Long buildingId, Long classroomId) {
        List<SourceItem> items = namedJdbc.query("""
            SELECT
                'BORROW_REQUEST' AS sourceType,
                r.borrow_request_id AS sourceId,
                r.semester_id AS semesterId,
                b.building_id AS buildingId,
                b.building_code AS buildingCode,
                cr.classroom_id AS classroomId,
                cr.classroom_code AS classroomCode,
                r.request_title AS title,
                r.request_type AS subtitle,
                r.booking_date AS accessDate,
                r.start_time AS startTime,
                r.end_time AS endTime,
                r.status AS sourceStatus
            FROM room_borrow_requests r
            JOIN classrooms cr ON cr.classroom_id = r.approved_classroom_id AND cr.is_deleted = FALSE
            JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            WHERE r.borrow_request_id = :sourceId
              AND r.semester_id = :semesterId
              AND b.building_id = :buildingId
              AND cr.classroom_id = :classroomId
              AND r.status IN ('APPROVED', 'CANCELLED', 'REJECTED')
            """,
                new MapSqlParameterSource()
                        .addValue("sourceId", sourceId)
                        .addValue("semesterId", semesterId)
                        .addValue("buildingId", buildingId)
                        .addValue("classroomId", classroomId),
                sourceItemRowMapper(FacilityOpeningSourceType.BORROW_REQUEST)
        );
        return items.isEmpty() ? null : items.get(0);
    }

    private SourceItem findExamSource(Long sourceId, Integer semesterId, Long buildingId, Long classroomId) {
        List<SourceItem> items = namedJdbc.query("""
            SELECT
                'EXAM' AS sourceType,
                e.exam_id AS sourceId,
                e.semester_id AS semesterId,
                b.building_id AS buildingId,
                b.building_code AS buildingCode,
                cr.classroom_id AS classroomId,
                cr.classroom_code AS classroomCode,
                CONCAT('Thi ', c.course_name) AS title,
                CONCAT(e.exam_type, ' - ', sec.section_code) AS subtitle,
                e.exam_date AS accessDate,
                e.start_time AS startTime,
                e.end_time AS endTime,
                e.status AS sourceStatus
            FROM exams e
            JOIN classrooms cr ON cr.classroom_id = e.classroom_id AND cr.is_deleted = FALSE
            JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            JOIN class_sections sec ON sec.section_id = e.section_id
            JOIN courses c ON c.course_id = sec.course_id
            WHERE e.exam_id = :sourceId
              AND e.semester_id = :semesterId
              AND b.building_id = :buildingId
              AND cr.classroom_id = :classroomId
            """,
                new MapSqlParameterSource()
                        .addValue("sourceId", sourceId)
                        .addValue("semesterId", semesterId)
                        .addValue("buildingId", buildingId)
                        .addValue("classroomId", classroomId),
                sourceItemRowMapper(FacilityOpeningSourceType.EXAM)
        );
        return items.isEmpty() ? null : items.get(0);
    }

    private List<SourceItem> findClassSessionSources(Integer semesterId, Long buildingId, LocalDate date) {
        return namedJdbc.query("""
            SELECT
                'CLASS_SESSION' AS sourceType,
                cs.class_session_id AS sourceId,
                sec.semester_id AS semesterId,
                b.building_id AS buildingId,
                b.building_code AS buildingCode,
                cr.classroom_id AS classroomId,
                cr.classroom_code AS classroomCode,
                c.course_name AS title,
                sec.section_code AS subtitle,
                cs.session_date AS accessDate,
                cs.start_time AS startTime,
                cs.end_time AS endTime,
                cs.session_status AS sourceStatus
            FROM class_sessions cs
            JOIN classrooms cr ON cr.classroom_id = cs.classroom_id AND cr.is_deleted = FALSE
            JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            JOIN class_sections sec ON sec.section_id = cs.section_id
            JOIN courses c ON c.course_id = sec.course_id
            WHERE cr.building_id = :buildingId
              AND cs.session_date = :date
              AND sec.semester_id = :semesterId
            """,
                new MapSqlParameterSource()
                        .addValue("buildingId", buildingId)
                        .addValue("semesterId", semesterId)
                        .addValue("date", date),
                sourceItemRowMapper(FacilityOpeningSourceType.CLASS_SESSION)
        );
    }

    private List<SourceItem> findBorrowRequestSources(Integer semesterId, Long buildingId, LocalDate date) {
        return namedJdbc.query("""
            SELECT
                'BORROW_REQUEST' AS sourceType,
                r.borrow_request_id AS sourceId,
                r.semester_id AS semesterId,
                b.building_id AS buildingId,
                b.building_code AS buildingCode,
                cr.classroom_id AS classroomId,
                cr.classroom_code AS classroomCode,
                r.request_title AS title,
                r.request_type AS subtitle,
                r.booking_date AS accessDate,
                r.start_time AS startTime,
                r.end_time AS endTime,
                r.status AS sourceStatus
            FROM room_borrow_requests r
            JOIN classrooms cr ON cr.classroom_id = r.approved_classroom_id AND cr.is_deleted = FALSE
            JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            WHERE cr.building_id = :buildingId
              AND r.booking_date = :date
              AND r.semester_id = :semesterId
              AND r.status IN ('APPROVED', 'CANCELLED', 'REJECTED')
            """,
                new MapSqlParameterSource()
                        .addValue("buildingId", buildingId)
                        .addValue("semesterId", semesterId)
                        .addValue("date", date),
                sourceItemRowMapper(FacilityOpeningSourceType.BORROW_REQUEST)
        );
    }

    private List<SourceItem> findExamSources(Integer semesterId, Long buildingId, LocalDate date) {
        return namedJdbc.query("""
            SELECT
                'EXAM' AS sourceType,
                e.exam_id AS sourceId,
                e.semester_id AS semesterId,
                b.building_id AS buildingId,
                b.building_code AS buildingCode,
                cr.classroom_id AS classroomId,
                cr.classroom_code AS classroomCode,
                CONCAT('Thi ', c.course_name) AS title,
                CONCAT(e.exam_type, ' - ', sec.section_code) AS subtitle,
                e.exam_date AS accessDate,
                e.start_time AS startTime,
                e.end_time AS endTime,
                e.status AS sourceStatus
            FROM exams e
            JOIN classrooms cr ON cr.classroom_id = e.classroom_id AND cr.is_deleted = FALSE
            JOIN buildings b ON b.building_id = cr.building_id AND b.is_deleted = FALSE
            JOIN class_sections sec ON sec.section_id = e.section_id
            JOIN courses c ON c.course_id = sec.course_id
            WHERE cr.building_id = :buildingId
              AND e.exam_date = :date
              AND e.semester_id = :semesterId
            """,
                new MapSqlParameterSource()
                        .addValue("buildingId", buildingId)
                        .addValue("semesterId", semesterId)
                        .addValue("date", date),
                sourceItemRowMapper(FacilityOpeningSourceType.EXAM)
        );
    }

    private FacilityAssignmentResponse findAssignmentById(Long assignmentId) {
        List<FacilityAssignmentResponse> items = namedJdbc.query("""
            SELECT
                a.assignment_id AS id,
                a.semester_id AS semesterId,
                sem.semester_code AS semesterCode,
                sem.semester_name AS semesterName,
                a.facility_staff_id AS facilityStaffId,
                fs.staff_code AS staffCode,
                u.username AS username,
                a.building_id AS buildingId,
                b.building_code AS buildingCode,
                b.building_name AS buildingName,
                a.status AS status,
                a.note AS note,
                a.assigned_by AS assignedBy,
                creator.username AS assignedByUsername,
                a.assigned_at AS assignedAt,
                a.created_at AS createdAt,
                a.updated_at AS updatedAt
            FROM facility_building_assignments a
            JOIN facility_staff fs ON fs.facility_staff_id = a.facility_staff_id AND fs.is_deleted = FALSE
            JOIN users u ON u.user_id = fs.user_id
            JOIN semesters sem ON sem.semester_id = a.semester_id AND sem.is_deleted = FALSE
            JOIN buildings b ON b.building_id = a.building_id AND b.is_deleted = FALSE
            LEFT JOIN users creator ON creator.user_id = a.assigned_by
            WHERE a.assignment_id = :assignmentId
            """,
                new MapSqlParameterSource().addValue("assignmentId", assignmentId),
                assignmentRowMapper()
        );
        if (items.isEmpty()) {
            throw new ResourceNotFoundException(
                    "FACILITY_ASSIGNMENT_NOT_FOUND",
                    "Không tìm thấy phân công CSVC."
            );
        }
        return items.get(0);
    }

    private AssignmentRef findAssignmentReference(Long assignmentId) {
        List<AssignmentRef> rows = namedJdbc.query("""
            SELECT assignment_id, semester_id, facility_staff_id, building_id, status
            FROM facility_building_assignments
            WHERE assignment_id = :assignmentId
            """,
                new MapSqlParameterSource().addValue("assignmentId", assignmentId),
                (rs, rowNum) -> new AssignmentRef(
                        rs.getLong("assignment_id"),
                        rs.getLong("semester_id"),
                        rs.getLong("facility_staff_id"),
                        rs.getLong("building_id"),
                        FacilityAssignmentStatus.valueOf(rs.getString("status"))
                )
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "FACILITY_ASSIGNMENT_NOT_FOUND",
                    "Không tìm thấy phân công CSVC."
            );
        }
        return rows.get(0);
    }

    private SemesterRef findSemester(Integer semesterId) {
        List<SemesterRef> rows = namedJdbc.query("""
            SELECT semester_id, semester_code, semester_name
            FROM semesters
            WHERE semester_id = :semesterId
              AND is_deleted = FALSE
            """,
                new MapSqlParameterSource().addValue("semesterId", semesterId),
                (rs, rowNum) -> new SemesterRef(
                        rs.getLong("semester_id"),
                        rs.getString("semester_code"),
                        rs.getString("semester_name")
                )
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "SEMESTER_NOT_FOUND",
                    "Không tìm thấy học kỳ."
            );
        }
        return rows.get(0);
    }

    private SemesterRef findSemesterOrActive(Integer semesterId) {
        if (semesterId != null) {
            return findSemester(semesterId);
        }

        List<SemesterRef> rows = namedJdbc.query("""
            SELECT semester_id, semester_code, semester_name
            FROM semesters
            WHERE is_deleted = FALSE
              AND status = 'ACTIVE'
            ORDER BY semester_id DESC
            LIMIT 1
            """,
                new MapSqlParameterSource(),
                (rs, rowNum) -> new SemesterRef(
                        rs.getLong("semester_id"),
                        rs.getString("semester_code"),
                        rs.getString("semester_name")
                )
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "SEMESTER_NOT_FOUND",
                    "Không tìm thấy học kỳ đang hoạt động."
            );
        }
        return rows.get(0);
    }

    private FacilityStaffRef findFacilityStaffByUserId(Integer userId) {
        List<FacilityStaffRef> rows = namedJdbc.query("""
            SELECT
                fs.facility_staff_id AS facilityStaffId,
                fs.staff_code AS staffCode,
                u.username AS username,
                u.role AS role,
                u.status AS userStatus,
                fs.is_deleted AS isDeleted
            FROM facility_staff fs
            JOIN users u ON u.user_id = fs.user_id
            WHERE fs.user_id = :userId
            """,
                new MapSqlParameterSource().addValue("userId", userId),
                (rs, rowNum) -> new FacilityStaffRef(
                        rs.getLong("facilityStaffId"),
                        rs.getString("staffCode"),
                        rs.getString("username"),
                        rs.getString("role"),
                        rs.getString("userStatus"),
                        rs.getBoolean("isDeleted")
                )
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "FACILITY_NOT_FOUND",
                    "Không tìm thấy hồ sơ nhân viên CSVC."
            );
        }
        return rows.get(0);
    }

    private FacilityStaffRef findFacilityStaff(Long facilityStaffId) {
        List<FacilityStaffRef> rows = namedJdbc.query("""
            SELECT
                fs.facility_staff_id AS facilityStaffId,
                fs.staff_code AS staffCode,
                u.username AS username,
                u.role AS role,
                u.status AS userStatus,
                fs.is_deleted AS isDeleted
            FROM facility_staff fs
            JOIN users u ON u.user_id = fs.user_id
            WHERE fs.facility_staff_id = :facilityStaffId
            """,
                new MapSqlParameterSource().addValue("facilityStaffId", facilityStaffId),
                (rs, rowNum) -> new FacilityStaffRef(
                        rs.getLong("facilityStaffId"),
                        rs.getString("staffCode"),
                        rs.getString("username"),
                        rs.getString("role"),
                        rs.getString("userStatus"),
                        rs.getBoolean("isDeleted")
                )
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "FACILITY_NOT_FOUND",
                    "Không tìm thấy hồ sơ nhân viên CSVC."
            );
        }
        return rows.get(0);
    }

    private BuildingRef findBuilding(Integer buildingId) {
        List<BuildingRef> rows = namedJdbc.query("""
            SELECT building_id, building_code, building_name
            FROM buildings
            WHERE building_id = :buildingId
              AND is_deleted = FALSE
            """,
                new MapSqlParameterSource().addValue("buildingId", buildingId),
                (rs, rowNum) -> new BuildingRef(
                        rs.getLong("building_id"),
                        rs.getString("building_code"),
                        rs.getString("building_name")
                )
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "FACILITY_NOT_FOUND",
                    "Không tìm thấy tòa nhà."
            );
        }
        return rows.get(0);
    }

    private ClassroomRef findClassroom(Long classroomId) {
        List<ClassroomRef> rows = namedJdbc.query("""
            SELECT
                cr.classroom_id AS classroomId,
                cr.classroom_code AS classroomCode,
                cr.building_id AS buildingId
            FROM classrooms cr
            WHERE cr.classroom_id = :classroomId
              AND cr.is_deleted = FALSE
            """,
                new MapSqlParameterSource().addValue("classroomId", classroomId),
                (rs, rowNum) -> new ClassroomRef(
                        rs.getLong("classroomId"),
                        rs.getString("classroomCode"),
                        rs.getLong("buildingId")
                )
        );
        if (rows.isEmpty()) {
            throw new ResourceNotFoundException(
                    "OPENING_SOURCE_NOT_FOUND",
                    "Không tìm thấy phòng học."
            );
        }
        return rows.get(0);
    }

    private AssignmentContext findActiveAssignmentContext(Long facilityStaffId, Long semesterId) {
        List<AssignmentContext> rows = namedJdbc.query("""
            SELECT
                a.assignment_id AS assignmentId,
                a.semester_id AS semesterId,
                a.facility_staff_id AS facilityStaffId,
                a.building_id AS buildingId,
                a.status AS status,
                a.note AS note,
                a.assigned_at AS assignedAt,
                b.building_code AS buildingCode,
                b.building_name AS buildingName
            FROM facility_building_assignments a
            JOIN buildings b ON b.building_id = a.building_id AND b.is_deleted = FALSE
            WHERE a.facility_staff_id = :facilityStaffId
              AND a.semester_id = :semesterId
              AND a.status = 'ACTIVE'
            """,
                new MapSqlParameterSource()
                        .addValue("facilityStaffId", facilityStaffId)
                        .addValue("semesterId", semesterId),
                (rs, rowNum) -> new AssignmentContext(
                        rs.getLong("assignmentId"),
                        rs.getLong("semesterId"),
                        rs.getLong("facilityStaffId"),
                        rs.getLong("buildingId"),
                        rs.getString("buildingCode"),
                        rs.getString("buildingName"),
                        FacilityAssignmentStatus.valueOf(rs.getString("status")),
                        rs.getString("note"),
                        rs.getObject("assignedAt", LocalDateTime.class)
                )
        );
        if (rows.isEmpty()) {
            long activeCount = namedJdbc.getJdbcTemplate().queryForObject("""
                    SELECT COUNT(*)
                    FROM facility_building_assignments
                    WHERE facility_staff_id = ?
                      AND semester_id = ?
                      AND status = 'ACTIVE'
                    """, Long.class, facilityStaffId, semesterId);
            if (activeCount > 1) {
                throw new BadRequestException(
                        "FACILITY_ASSIGNMENT_DUPLICATED",
                        "Nhân viên CSVC có nhiều phân công ACTIVE trong học kỳ này."
                );
            }
            throw new ResourceNotFoundException(
                    "FACILITY_ASSIGNMENT_NOT_FOUND",
                    "Bạn chưa được phân công tòa nhà trong học kỳ này."
            );
        }
        if (rows.size() > 1) {
            throw new BadRequestException(
                    "FACILITY_ASSIGNMENT_DUPLICATED",
                    "Nhân viên CSVC có nhiều phân công ACTIVE trong học kỳ này."
            );
        }
        return rows.get(0);
    }

    private boolean existsAssignment(Long semesterId, Long facilityStaffId) {
        Integer count = namedJdbc.getJdbcTemplate().queryForObject("""
                SELECT COUNT(*)
                FROM facility_building_assignments
                WHERE semester_id = ?
                  AND facility_staff_id = ?
                """, Integer.class, semesterId, facilityStaffId);
        return count != null && count > 0;
    }

    private boolean existsAssignment(Long semesterId, Long facilityStaffId, Long excludedAssignmentId) {
        Integer count = namedJdbc.getJdbcTemplate().queryForObject("""
                SELECT COUNT(*)
                FROM facility_building_assignments
                WHERE semester_id = ?
                  AND facility_staff_id = ?
                  AND assignment_id <> ?
                """, Integer.class, semesterId, facilityStaffId, excludedAssignmentId);
        return count != null && count > 0;
    }

    private void ensureFacilityRoleAndActive(FacilityStaffRef facilityStaff) {
        if (!"FACILITY".equalsIgnoreCase(facilityStaff.role) || facilityStaff.isDeleted) {
            throw new BadRequestException(
                    "FACILITY_NOT_FOUND",
                    "Nhân viên CSVC không hợp lệ."
            );
        }
        if (!"ACTIVE".equalsIgnoreCase(facilityStaff.userStatus)) {
            throw new BadRequestException(
                    "FACILITY_NOT_FOUND",
                    "Tài khoản CSVC không còn hoạt động."
            );
        }
    }

    private void validateAssignmentRequest(FacilityAssignmentUpsertRequest request) {
        if (request == null) {
            throw new BadRequestException("VALIDATION_FAILED", "Dữ liệu phân công không hợp lệ.");
        }
    }

    private void validateIssueRequest(FacilityIssueReportCreateRequest request) {
        if (request == null) {
            throw new BadRequestException("VALIDATION_FAILED", "Dữ liệu sự cố không hợp lệ.");
        }
    }

    private void insertAuditLog(
            Integer userId,
            AuditAction action,
            SourceItem source,
            Map<String, Object> newValues,
            String description
    ) {
        String json = toJson(newValues);
        jdbcTemplate.update("""
            INSERT INTO audit_logs (
                user_id,
                action,
                table_name,
                record_id,
                new_values,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
                userId,
                action.name(),
                tableNameForSourceType(source.sourceType()),
                source.sourceId(),
                json,
                description
        );
    }

    private Map<String, Object> parseAuditPayloadMap(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JsonProcessingException exception) {
            return Map.of();
        }
    }

    private SourceAuditPayload parseAuditPayload(String json) {
        Map<String, Object> values = parseAuditPayloadMap(json);
        if (values.isEmpty()) {
            return null;
        }
        try {
            String type = stringValue(values.get("sourceType"));
            Long sourceId = longValue(values.get("sourceId"));
            Long classroomId = longValue(values.get("classroomId"));
            return new SourceAuditPayload(
                    type == null ? null : FacilityOpeningSourceType.valueOf(type),
                    sourceId,
                    classroomId
            );
        } catch (Exception exception) {
            return null;
        }
    }

    private RowMapper<FacilityAssignmentResponse> assignmentRowMapper() {
        return (rs, rowNum) -> new FacilityAssignmentResponse(
                rs.getLong("id"),
                rs.getLong("semesterId"),
                rs.getString("semesterCode"),
                rs.getString("semesterName"),
                rs.getLong("facilityStaffId"),
                rs.getString("staffCode"),
                rs.getString("username"),
                rs.getString("username"),
                rs.getLong("buildingId"),
                rs.getString("buildingCode"),
                rs.getString("buildingName"),
                FacilityAssignmentStatus.valueOf(rs.getString("status")),
                rs.getString("note"),
                rs.getObject("assignedBy") == null ? null : rs.getLong("assignedBy"),
                rs.getString("assignedByUsername"),
                rs.getObject("assignedAt", LocalDateTime.class),
                rs.getObject("createdAt", LocalDateTime.class),
                rs.getObject("updatedAt", LocalDateTime.class)
        );
    }

    private RowMapper<SourceItem> sourceItemRowMapper(FacilityOpeningSourceType sourceType) {
        return (rs, rowNum) -> new SourceItem(
                sourceType,
                rs.getLong("sourceId"),
                rs.getLong("semesterId"),
                rs.getLong("buildingId"),
                rs.getString("buildingCode"),
                rs.getLong("classroomId"),
                rs.getString("classroomCode"),
                rs.getString("title"),
                rs.getString("subtitle"),
                rs.getObject("accessDate", LocalDate.class),
                rs.getObject("startTime", LocalTime.class),
                rs.getObject("endTime", LocalTime.class),
                isCancelledStatus(sourceType, rs.getString("sourceStatus"))
        );
    }

    private RowMapper<AuditRow> auditRowMapper() {
        return (rs, rowNum) -> new AuditRow(
                AuditAction.valueOf(rs.getString("action")),
                rs.getLong("recordId"),
                rs.getString("newValues"),
                rs.getObject("createdAt", LocalDateTime.class)
        );
    }

    private <T> PageResponse<T> pageResult(List<T> items, Integer page, Integer size) {
        int resolvedPage = page == null ? 0 : Math.max(0, page);
        int resolvedSize = size == null ? 20 : Math.min(100, Math.max(1, size));
        int totalItems = items.size();
        int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / resolvedSize);
        int fromIndex = Math.min(resolvedPage * resolvedSize, totalItems);
        int toIndex = Math.min(fromIndex + resolvedSize, totalItems);
        List<T> pageItems = items.subList(fromIndex, toIndex);
        return new PageResponse<>(pageItems, resolvedPage, resolvedSize, totalItems, totalPages);
    }

    private FacilityAssignmentStatus normalizeAssignmentStatus(String status) {
        String normalized = normalizeBlank(status);
        if (normalized == null || normalized.equalsIgnoreCase("ALL")) {
            return null;
        }
        try {
            return FacilityAssignmentStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (Exception exception) {
            throw new BadRequestException("VALIDATION_FAILED", "Trạng thái phân công không hợp lệ.");
        }
    }

    private FacilityOpeningSourceType normalizeSourceType(String sourceType) {
        String normalized = normalizeBlank(sourceType);
        if (normalized == null || normalized.equalsIgnoreCase("ALL")) {
            return null;
        }
        try {
            return FacilityOpeningSourceType.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (Exception exception) {
            throw new BadRequestException("INVALID_SOURCE_TYPE", "Loại lịch không hợp lệ.");
        }
    }

    private FacilityOpeningStatus normalizeOpeningStatus(String status) {
        String normalized = normalizeBlank(status);
        if (normalized == null || normalized.equalsIgnoreCase("ALL")) {
            return null;
        }
        try {
            return FacilityOpeningStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (Exception exception) {
            throw new BadRequestException("VALIDATION_FAILED", "Trạng thái lịch mở cửa không hợp lệ.");
        }
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("VALIDATION_FAILED", fieldName + " is required.");
        }
        return value.trim();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeEnum(String value, Set<String> allowedValues, String fieldName) {
        String normalized = normalizeRequired(value, fieldName).toUpperCase(Locale.ROOT);
        if (!allowedValues.contains(normalized)) {
            throw new BadRequestException("VALIDATION_FAILED", fieldName + " is invalid: " + value);
        }
        return normalized;
    }

    private boolean isCancelledStatus(FacilityOpeningSourceType sourceType, String sourceStatus) {
        if (sourceStatus == null) {
            return false;
        }
        String normalized = sourceStatus.trim().toUpperCase(Locale.ROOT);
        return switch (sourceType) {
            case CLASS_SESSION -> "CANCELLED".equals(normalized);
            case BORROW_REQUEST -> "CANCELLED".equals(normalized) || "REJECTED".equals(normalized);
            case EXAM -> "CANCELLED".equals(normalized);
        };
    }

    private String tableNameForSourceType(FacilityOpeningSourceType sourceType) {
        return switch (sourceType) {
            case CLASS_SESSION -> "class_sessions";
            case BORROW_REQUEST -> "room_borrow_requests";
            case EXAM -> "exams";
        };
    }

    private boolean containsIgnoreCase(String value, String keyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }

    private String resolveDataAccessMessage(DataAccessException exception, String fallback) {
        Throwable cause = exception.getRootCause();
        if (cause != null && cause.getMessage() != null && !cause.getMessage().isBlank()) {
            return cause.getMessage();
        }
        return fallback;
    }

    private String toJson(Map<String, Object> values) {
        try {
            return objectMapper.writeValueAsString(new LinkedHashMap<>(values));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Không thể tạo JSON cho audit log", exception);
        }
    }

    private Long longValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private Map<SourceKey, AuditState> refreshAuditStates(SourceItem source) {
        return loadAuditStates(List.of(source));
    }

    private record SemesterRef(Long id, String code, String name) {
    }

    private record FacilityStaffRef(Long id, String staffCode, String username, String role, String userStatus, boolean isDeleted) {
    }

    private record BuildingRef(Long id, String code, String name) {
    }

    private record ClassroomRef(Long id, String classroomCode, Long buildingId) {
    }

    private record AssignmentRef(Long id, Long semesterId, Long facilityStaffId, Long buildingId, FacilityAssignmentStatus status) {
    }

    private record AssignmentContext(
            Long assignmentId,
            Long semesterId,
            Long facilityStaffId,
            Long buildingId,
            String buildingCode,
            String buildingName,
            FacilityAssignmentStatus status,
            String note,
            LocalDateTime assignedAt
    ) {
    }

    private record SourceItem(
            FacilityOpeningSourceType sourceType,
            Long sourceId,
            Long semesterId,
            Long buildingId,
            String buildingCode,
            Long classroomId,
            String classroomCode,
            String title,
            String subtitle,
            LocalDate accessDate,
            LocalTime startTime,
            LocalTime endTime,
            boolean cancelled
    ) {
        SourceKey key() {
            return new SourceKey(sourceType, sourceId, classroomId);
        }
    }

    private record SourceKey(FacilityOpeningSourceType sourceType, Long sourceId, Long classroomId) {
    }

    private static final class AuditState {
        private LocalDateTime openedAt;
        private LocalDateTime closedAt;

        private static AuditState empty() {
            return new AuditState();
        }
    }

    private record AuditRow(AuditAction action, Long recordId, String newValues, LocalDateTime createdAt) {
    }

    private record SourceAuditPayload(FacilityOpeningSourceType sourceType, Long sourceId, Long classroomId) {
    }
}
