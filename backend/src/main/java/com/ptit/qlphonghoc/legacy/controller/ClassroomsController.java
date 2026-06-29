package com.ptit.qlphonghoc.legacy.controller;

import com.ptit.qlphonghoc.legacy.common.ApiResponse;
import com.ptit.qlphonghoc.legacy.common.DbHelper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping({ "/classrooms", "/api/classrooms" })
public class ClassroomsController {
    private final JdbcTemplate jdbcTemplate;

    public ClassroomsController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<ApiResponse> getAll(@RequestParam Map<String, String> params) {
        try {
            String sql = """
                    SELECT c.classroom_id,
                           c.classroom_id AS id,
                           c.building_id,
                           c.floor_number,
                           c.room_number,
                           c.classroom_code,
                           c.classroom_code AS code,
                           c.classroom_code AS room_code,
                           c.classroom_name,
                           c.classroom_name AS name,
                           c.classroom_name AS room_name,
                           c.room_type,
                           c.capacity,
                           c.has_projector,
                           c.has_ac,
                           c.is_active,
                           c.created_at,
                           c.updated_at,
                           c.is_deleted,
                           b.building_name,
                           b.building_code,
                           CONCAT(b.building_code, '-', c.room_number) AS display_room_code
                    FROM classrooms c
                    LEFT JOIN buildings b ON c.building_id = b.building_id
                    WHERE c.is_deleted = 0
                    ORDER BY c.classroom_id DESC
                    """;

            List<Map<String, Object>> rooms = jdbcTemplate.queryForList(sql);
            rooms.forEach(this::enrichClassroomUsageStatus);

            return ResponseEntity.ok(
                    ApiResponse.ok(
                            "Fetch classrooms successfully",
                            rooms));
        } catch (DataAccessException e) {
            throw e;
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getById(@PathVariable Integer id) {
        try {
            String sql = """
                    SELECT c.classroom_id,
                           c.classroom_id AS id,
                           c.building_id,
                           c.floor_number,
                           c.room_number,
                           c.classroom_code,
                           c.classroom_code AS code,
                           c.classroom_code AS room_code,
                           c.classroom_name,
                           c.classroom_name AS name,
                           c.classroom_name AS room_name,
                           c.room_type,
                           c.capacity,
                           c.has_projector,
                           c.has_ac,
                           c.is_active,
                           c.created_at,
                           c.updated_at,
                           c.is_deleted,
                           b.building_name,
                           b.building_code,
                           CONCAT(b.building_code, '-', c.room_number) AS display_room_code
                    FROM classrooms c
                    LEFT JOIN buildings b ON c.building_id = b.building_id
                    WHERE c.is_deleted = 0
                      AND c.classroom_id = ?
                    """;

            Map<String, Object> row = DbHelper.firstOrNull(jdbcTemplate, sql, id);

            if (row == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("Classroom not found"));
            }

            enrichClassroomUsageStatus(row);

            return ResponseEntity.ok(ApiResponse.ok("Fetch classroom successfully", row));
        } catch (DataAccessException e) {
            throw e;
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse> create(@RequestBody Map<String, Object> body) {
        try {
            Integer buildingId = toInteger(read(body, "building_id", "buildingId"));
            Integer floorNumber = toInteger(read(body, "floor_number", "floorNumber"));
            String roomNumber = toStringValue(read(body, "room_number", "roomNumber"));
            String classroomName = toStringValue(
                    read(body, "classroom_name", "classroomName", "room_name", "roomName", "name"));
            String roomType = toStringValue(read(body, "room_type", "roomType"));
            Integer capacity = toInteger(read(body, "capacity"));
            Boolean hasProjector = toBoolean(read(body, "has_projector", "hasProjector"), false);
            Boolean hasAc = toBoolean(read(body, "has_ac", "hasAc"), false);
            Boolean isActive = toBoolean(read(body, "is_active", "isActive"), true);

            if (buildingId == null) {
                return badRequest("Vui lòng chọn tòa nhà.");
            }

            if (roomNumber.isBlank()) {
                return badRequest("Số phòng không được để trống.");
            }

            if (floorNumber == null || floorNumber < 0) {
                return badRequest("Tầng phòng không hợp lệ.");
            }

            if (capacity == null || capacity <= 0) {
                return badRequest("Sức chứa phải lớn hơn 0.");
            }

            roomType = roomType.isBlank()
                    ? "LECTURE"
                    : roomType.trim().toUpperCase(Locale.ROOT);

            if (!List.of("LECTURE", "LAB", "SEMINAR", "AUDITORIUM").contains(roomType)) {
                return badRequest("Loại phòng không hợp lệ.");
            }

            if (!existsBuilding(buildingId)) {
                return badRequest("Tòa nhà không tồn tại.");
            }

            String classroomCode = toStringValue(
                    read(body, "classroom_code", "classroomCode", "room_code", "roomCode", "code"));

            if (classroomCode.isBlank()) {
                classroomCode = buildClassroomCode(buildingId, roomNumber);
            }

            if (classroomName.isBlank()) {
                classroomName = classroomCode;
            }

            if (existsClassroomCode(classroomCode, null)) {
                return badRequest("Mã phòng học đã tồn tại: " + classroomCode);
            }

            if (existsRoomNumberInBuilding(buildingId, roomNumber, null)) {
                return badRequest("Số phòng đã tồn tại trong tòa nhà này: " + roomNumber);
            }

            Number newId = DbHelper.insert(
                    jdbcTemplate,
                    """
                            INSERT INTO classrooms
                                (
                                    building_id,
                                    floor_number,
                                    room_number,
                                    classroom_code,
                                    classroom_name,
                                    room_type,
                                    capacity,
                                    has_projector,
                                    has_ac,
                                    is_active,
                                    is_deleted
                                )
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                            """,
                    buildingId,
                    floorNumber,
                    roomNumber,
                    classroomCode,
                    classroomName,
                    roomType,
                    capacity,
                    hasProjector ? 1 : 0,
                    hasAc ? 1 : 0,
                    isActive ? 1 : 0);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Create classroom successfully",
                            DbHelper.row("classroom_id", newId, "id", newId)));
        } catch (DataAccessException e) {
            throw e;
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> update(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> current = DbHelper.firstOrNull(
                    jdbcTemplate,
                    "SELECT * FROM classrooms WHERE classroom_id = ? AND is_deleted = 0",
                    id);

            if (current == null) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("Classroom not found"));
            }

            Integer buildingId = hasAnyKey(body, "building_id", "buildingId")
                    ? toInteger(read(body, "building_id", "buildingId"))
                    : toInteger(current.get("building_id"));

            Integer floorNumber = hasAnyKey(body, "floor_number", "floorNumber")
                    ? toInteger(read(body, "floor_number", "floorNumber"))
                    : toInteger(current.get("floor_number"));

            String roomNumber = hasAnyKey(body, "room_number", "roomNumber")
                    ? toStringValue(read(body, "room_number", "roomNumber"))
                    : toStringValue(current.get("room_number"));

            String classroomName = hasAnyKey(body, "classroom_name", "classroomName", "room_name", "roomName", "name")
                    ? toStringValue(read(body, "classroom_name", "classroomName", "room_name", "roomName", "name"))
                    : toStringValue(current.get("classroom_name"));

            String roomType = hasAnyKey(body, "room_type", "roomType")
                    ? toStringValue(read(body, "room_type", "roomType"))
                    : toStringValue(current.get("room_type"));

            Integer capacity = hasAnyKey(body, "capacity")
                    ? toInteger(read(body, "capacity"))
                    : toInteger(current.get("capacity"));

            Boolean hasProjector = hasAnyKey(body, "has_projector", "hasProjector")
                    ? toBoolean(read(body, "has_projector", "hasProjector"), false)
                    : toBoolean(current.get("has_projector"), false);

            Boolean hasAc = hasAnyKey(body, "has_ac", "hasAc")
                    ? toBoolean(read(body, "has_ac", "hasAc"), false)
                    : toBoolean(current.get("has_ac"), false);

            Boolean isActive = hasAnyKey(body, "is_active", "isActive")
                    ? toBoolean(read(body, "is_active", "isActive"), true)
                    : toBoolean(current.get("is_active"), true);

            if (buildingId == null) {
                return badRequest("Vui lòng chọn tòa nhà.");
            }

            if (roomNumber.isBlank()) {
                return badRequest("Số phòng không được để trống.");
            }

            if (floorNumber == null || floorNumber < 0) {
                return badRequest("Tầng phòng không hợp lệ.");
            }

            if (capacity == null || capacity <= 0) {
                return badRequest("Sức chứa phải lớn hơn 0.");
            }

            roomType = roomType.isBlank()
                    ? "LECTURE"
                    : roomType.trim().toUpperCase(Locale.ROOT);

            if (!List.of("LECTURE", "LAB", "SEMINAR", "AUDITORIUM").contains(roomType)) {
                return badRequest("Loại phòng không hợp lệ.");
            }

            if (!existsBuilding(buildingId)) {
                return badRequest("Tòa nhà không tồn tại.");
            }

            String classroomCode = hasAnyKey(body, "classroom_code", "classroomCode", "room_code", "roomCode", "code")
                    ? toStringValue(read(body, "classroom_code", "classroomCode", "room_code", "roomCode", "code"))
                    : toStringValue(current.get("classroom_code"));

            boolean buildingOrRoomChanged = !String.valueOf(buildingId)
                    .equals(String.valueOf(current.get("building_id"))) ||
                    !roomNumber.equals(String.valueOf(current.get("room_number")));

            if (classroomCode.isBlank() || buildingOrRoomChanged) {
                classroomCode = buildClassroomCode(buildingId, roomNumber);
            }

            if (classroomName.isBlank()) {
                classroomName = classroomCode;
            }

            if (existsClassroomCode(classroomCode, id)) {
                return badRequest("Mã phòng học đã tồn tại: " + classroomCode);
            }

            if (existsRoomNumberInBuilding(buildingId, roomNumber, id)) {
                return badRequest("Số phòng đã tồn tại trong tòa nhà này: " + roomNumber);
            }

            jdbcTemplate.update(
                    """
                            UPDATE classrooms
                            SET building_id = ?,
                                floor_number = ?,
                                room_number = ?,
                                classroom_code = ?,
                                classroom_name = ?,
                                room_type = ?,
                                capacity = ?,
                                has_projector = ?,
                                has_ac = ?,
                                is_active = ?
                            WHERE classroom_id = ?
                            """,
                    buildingId,
                    floorNumber,
                    roomNumber,
                    classroomCode,
                    classroomName,
                    roomType,
                    capacity,
                    hasProjector ? 1 : 0,
                    hasAc ? 1 : 0,
                    isActive ? 1 : 0,
                    id);

            return ResponseEntity.ok(ApiResponse.ok("Update classroom successfully"));
        } catch (DataAccessException e) {
            throw e;
        } catch (Exception e) {
            return serverError(e);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable Integer id) {
        try {
            boolean exists = DbHelper.exists(
                    jdbcTemplate,
                    "SELECT 1 FROM classrooms WHERE classroom_id = ? AND is_deleted = 0",
                    id);

            if (!exists) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("Classroom not found"));
            }

            jdbcTemplate.update(
                    "UPDATE classrooms SET is_deleted = 1 WHERE classroom_id = ?",
                    id);

            return ResponseEntity.ok(ApiResponse.ok("Delete classroom successfully"));
        } catch (DataAccessException e) {
            throw e;
        } catch (Exception e) {
            return serverError(e);
        }
    }


    private void enrichClassroomUsageStatus(Map<String, Object> room) {
        Integer classroomId = toInteger(room.get("classroom_id"));

        if (classroomId == null) {
            classroomId = toInteger(room.get("id"));
        }

        boolean active = toBoolean(room.get("is_active"), true);
        boolean inUse = active && isClassroomInUse(classroomId);

        String usageStatus;
        String usageStatusLabel;

        if (!active) {
            usageStatus = "DISABLED";
            usageStatusLabel = "Bảo trì / Tạm ngưng";
        } else if (inUse) {
            usageStatus = "IN_USE";
            usageStatusLabel = "Đang được sử dụng";
        } else {
            usageStatus = "AVAILABLE";
            usageStatusLabel = "Sẵn sàng sử dụng";
        }

        room.put("is_in_use", inUse);
        room.put("isInUse", inUse);
        room.put("usage_status", usageStatus);
        room.put("usageStatus", usageStatus);
        room.put("usage_status_label", usageStatusLabel);
        room.put("usageStatusLabel", usageStatusLabel);
    }

    private boolean isClassroomInUse(Integer classroomId) {
        if (classroomId == null) {
            return false;
        }

        Integer usageCount = jdbcTemplate.queryForObject(
                """
                        SELECT
                            (
                                SELECT COUNT(*)
                                FROM schedules sc
                                JOIN class_sections cs ON cs.section_id = sc.section_id
                                WHERE sc.classroom_id = ?
                                  AND sc.status = 'ASSIGNED'
                                  AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
                            )
                            +
                            (
                                SELECT COUNT(*)
                                FROM class_sessions ses
                                JOIN class_sections cs ON cs.section_id = ses.section_id
                                WHERE ses.classroom_id = ?
                                  AND ses.session_status IN ('SCHEDULED', 'MAKEUP', 'RESCHEDULED')
                                  AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
                            )
                            +
                            (
                                SELECT COUNT(*)
                                FROM exams e
                                WHERE e.classroom_id = ?
                                  AND e.status IN ('DRAFT', 'SCHEDULED', 'ROOM_ASSIGNED', 'READY_FOR_APPROVAL', 'PUBLISHED')
                                  AND e.is_deleted = 0
                            )
                            +
                            (
                                SELECT COUNT(*)
                                FROM room_borrow_requests r
                                WHERE r.approved_classroom_id = ?
                                  AND r.status = 'APPROVED'
                                  AND r.booking_date >= CURDATE()
                            ) AS usage_count
                        """,
                Integer.class,
                classroomId,
                classroomId,
                classroomId,
                classroomId);

        return usageCount != null && usageCount > 0;
    }
    private boolean existsBuilding(Integer buildingId) {
        if (buildingId == null) {
            return false;
        }

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM buildings WHERE building_id = ? AND is_deleted = 0",
                Integer.class,
                buildingId);

        return count != null && count > 0;
    }

    private boolean existsClassroomCode(String classroomCode, Integer excludeId) {
        if (classroomCode == null || classroomCode.isBlank()) {
            return false;
        }

        Integer count;

        if (excludeId == null) {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE classroom_code = ? AND is_deleted = 0",
                    Integer.class,
                    classroomCode);
        } else {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE classroom_code = ? AND classroom_id <> ? AND is_deleted = 0",
                    Integer.class,
                    classroomCode,
                    excludeId);
        }

        return count != null && count > 0;
    }

    private boolean existsRoomNumberInBuilding(Integer buildingId, String roomNumber, Integer excludeId) {
        if (buildingId == null || roomNumber == null || roomNumber.isBlank()) {
            return false;
        }

        Integer count;

        if (excludeId == null) {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE building_id = ? AND room_number = ? AND is_deleted = 0",
                    Integer.class,
                    buildingId,
                    roomNumber);
        } else {
            count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM classrooms WHERE building_id = ? AND room_number = ? AND classroom_id <> ? AND is_deleted = 0",
                    Integer.class,
                    buildingId,
                    roomNumber,
                    excludeId);
        }

        return count != null && count > 0;
    }

    private String buildClassroomCode(Integer buildingId, String roomNumber) {
        String buildingCode = "";

        try {
            buildingCode = jdbcTemplate.queryForObject(
                    "SELECT building_code FROM buildings WHERE building_id = ?",
                    String.class,
                    buildingId);
        } catch (Exception ignored) {
            buildingCode = "";
        }

        if (buildingCode == null || buildingCode.isBlank()) {
            return roomNumber.trim().toUpperCase(Locale.ROOT);
        }

        return (buildingCode.trim() + "-" + roomNumber.trim()).toUpperCase(Locale.ROOT);
    }

    private Object read(Map<String, Object> body, String... keys) {
        if (body == null) {
            return null;
        }

        for (String key : keys) {
            if (body.containsKey(key)) {
                return body.get(key);
            }
        }

        return null;
    }

    private boolean hasAnyKey(Map<String, Object> body, String... keys) {
        if (body == null) {
            return false;
        }

        for (String key : keys) {
            if (body.containsKey(key)) {
                return true;
            }
        }

        return false;
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }

        String text = String.valueOf(value).trim();

        if (text.isBlank()) {
            return null;
        }

        try {
            if (text.endsWith(".0")) {
                text = text.substring(0, text.length() - 2);
            }

            return Integer.parseInt(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean toBoolean(Object value, boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }

        String text = String.valueOf(value).trim().toLowerCase(Locale.ROOT);

        if (text.isBlank()) {
            return defaultValue;
        }

        if (List.of("1", "true", "yes", "y", "active", "co", "có").contains(text)) {
            return true;
        }

        if (List.of("0", "false", "no", "n", "inactive", "khong", "không").contains(text)) {
            return false;
        }

        return defaultValue;
    }

    private String toStringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private ResponseEntity<ApiResponse> badRequest(String message) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.fail(message));
    }

    private ResponseEntity<ApiResponse> serverError(Exception e) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("Server error", cleanError(e)));
    }

    private String cleanError(Exception e) {
        String message = e.getMessage();

        if (message == null || message.isBlank()) {
            return e.getClass().getSimpleName();
        }

        return message.length() > 500 ? message.substring(0, 500) + "..." : message;
    }
}
