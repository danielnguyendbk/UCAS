-- =========================================================
-- UCAS / QLPHONGHOC - DATABASE CONSTRAINTS AND TRIGGERS
-- Run order:
--   1. schema.sql
--   2. seed_ucas_2025_2026_hk2_w23_44_.sql
--   3. constraints_triggers.sql
--   4. seed_hk3_import_test.sql, optional for HK3 import testing
-- =========================================================

USE QLPHONGHOC;

SET NAMES utf8mb4;
SET SQL_SAFE_UPDATES = 0;

-- =========================================================
-- 1. Timetable version table required by timetable import
-- =========================================================

CREATE TABLE IF NOT EXISTS timetable_versions (
    version_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    semester_id BIGINT UNSIGNED NOT NULL,

    version_code VARCHAR(100) NULL,
    version_name VARCHAR(255) NULL,
    version_no INT NOT NULL DEFAULT 1,
    version_number INT NULL,

    preview_id VARCHAR(100) NULL,
    import_preview_id VARCHAR(100) NULL,
    source_file_name VARCHAR(255) NULL,
    file_name VARCHAR(255) NULL,

    apply_mode VARCHAR(50) NULL,
    mode VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    created_by BIGINT UNSIGNED NULL,
    applied_by BIGINT UNSIGNED NULL,
    published_by BIGINT UNSIGNED NULL,

    note TEXT NULL,
    description TEXT NULL,
    change_summary TEXT NULL,
    summary TEXT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    applied_at DATETIME NULL,
    published_at DATETIME NULL,
    locked_at DATETIME NULL,

    is_active TINYINT(1) NOT NULL DEFAULT 1,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (version_id),

    KEY idx_timetable_versions_semester (semester_id),
    KEY idx_timetable_versions_status (status),
    KEY idx_timetable_versions_preview (preview_id),
    KEY idx_timetable_versions_import_preview (import_preview_id),
    KEY idx_timetable_versions_semester_version_no (semester_id, version_no),

    CONSTRAINT fk_timetable_versions_semester
        FOREIGN KEY (semester_id)
        REFERENCES semesters(semester_id)
);

-- =========================================================
-- 2. Course active status sync
-- Logic:
--   courses.is_active = 0: course has no active class section
--   courses.is_active = 1: course is used by at least one active class section
-- =========================================================

ALTER TABLE courses
MODIFY COLUMN is_active BOOLEAN NOT NULL DEFAULT FALSE;

DELIMITER $$

DROP PROCEDURE IF EXISTS sync_course_active_status $$
CREATE PROCEDURE sync_course_active_status(IN p_course_id BIGINT)
BEGIN
    UPDATE courses c
    SET c.is_active = EXISTS (
        SELECT 1
        FROM class_sections cs
        WHERE cs.course_id = p_course_id
          AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
    )
    WHERE c.course_id = p_course_id;
END $$

DROP TRIGGER IF EXISTS trg_class_sections_sync_course_after_insert $$
CREATE TRIGGER trg_class_sections_sync_course_after_insert
AFTER INSERT ON class_sections
FOR EACH ROW
BEGIN
    CALL sync_course_active_status(NEW.course_id);
END $$

DROP TRIGGER IF EXISTS trg_class_sections_sync_course_after_update $$
CREATE TRIGGER trg_class_sections_sync_course_after_update
AFTER UPDATE ON class_sections
FOR EACH ROW
BEGIN
    CALL sync_course_active_status(OLD.course_id);

    IF NEW.course_id <> OLD.course_id THEN
        CALL sync_course_active_status(NEW.course_id);
    END IF;
END $$

DROP TRIGGER IF EXISTS trg_class_sections_sync_course_after_delete $$
CREATE TRIGGER trg_class_sections_sync_course_after_delete
AFTER DELETE ON class_sections
FOR EACH ROW
BEGIN
    CALL sync_course_active_status(OLD.course_id);
END $$

DROP TRIGGER IF EXISTS trg_courses_block_delete_or_manual_disable_if_in_use $$
CREATE TRIGGER trg_courses_block_delete_or_manual_disable_if_in_use
BEFORE UPDATE ON courses
FOR EACH ROW
BEGIN
    IF (
            OLD.is_deleted = FALSE 
            AND NEW.is_deleted = TRUE
       )
       OR (
            OLD.is_active = TRUE 
            AND NEW.is_active = FALSE
       )
    THEN
        IF EXISTS (
            SELECT 1
            FROM class_sections cs
            WHERE cs.course_id = OLD.course_id
              AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
            LIMIT 1
        )
        THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xóa hoặc vô hiệu hóa môn học đang được sử dụng trong lớp học phần.';
        END IF;
    END IF;
END $$

DROP TRIGGER IF EXISTS trg_courses_block_physical_delete_if_has_sections $$
CREATE TRIGGER trg_courses_block_physical_delete_if_has_sections
BEFORE DELETE ON courses
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1
        FROM class_sections cs
        WHERE cs.course_id = OLD.course_id
        LIMIT 1
    )
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể xóa cứng môn học đã phát sinh lớp học phần.';
    END IF;
END $$

-- =========================================================
-- 3. Classroom constraints
-- Logic:
--   - Classroom in use cannot be deleted.
--   - Disabled/deleted classroom cannot be assigned to a new schedule.
--   - Classroom can still be disabled for maintenance, but cannot be used for new assignments.
-- =========================================================

DROP TRIGGER IF EXISTS trg_classrooms_block_soft_delete_if_in_use $$
CREATE TRIGGER trg_classrooms_block_soft_delete_if_in_use
BEFORE UPDATE ON classrooms
FOR EACH ROW
BEGIN
    IF OLD.is_deleted = FALSE
       AND NEW.is_deleted = TRUE
       AND (
            EXISTS (
                SELECT 1
                FROM schedules sc
                JOIN class_sections cs ON cs.section_id = sc.section_id
                WHERE sc.classroom_id = OLD.classroom_id
                  AND sc.status = 'ASSIGNED'
                  AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
                LIMIT 1
            )
            OR EXISTS (
                SELECT 1
                FROM class_sessions ses
                JOIN class_sections cs ON cs.section_id = ses.section_id
                WHERE ses.classroom_id = OLD.classroom_id
                  AND ses.session_status IN ('SCHEDULED', 'MAKEUP', 'RESCHEDULED')
                  AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
                LIMIT 1
            )
            OR EXISTS (
                SELECT 1
                FROM exams e
                WHERE e.classroom_id = OLD.classroom_id
                  AND e.status IN ('DRAFT', 'SCHEDULED', 'ROOM_ASSIGNED', 'READY_FOR_APPROVAL', 'PUBLISHED')
                  AND e.is_deleted = FALSE
                LIMIT 1
            )
            OR EXISTS (
                SELECT 1
                FROM room_borrow_requests r
                WHERE r.approved_classroom_id = OLD.classroom_id
                  AND r.status = 'APPROVED'
                  AND r.booking_date >= CURDATE()
                LIMIT 1
            )
       )
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể xóa phòng học đang được sử dụng trong lịch học, buổi học, lịch thi hoặc yêu cầu đặt phòng.';
    END IF;
END $$

DROP TRIGGER IF EXISTS trg_classrooms_block_physical_delete $$
CREATE TRIGGER trg_classrooms_block_physical_delete
BEFORE DELETE ON classrooms
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM schedules WHERE classroom_id = OLD.classroom_id LIMIT 1)
       OR EXISTS (SELECT 1 FROM class_sessions WHERE classroom_id = OLD.classroom_id LIMIT 1)
       OR EXISTS (SELECT 1 FROM exams WHERE classroom_id = OLD.classroom_id LIMIT 1)
       OR EXISTS (
            SELECT 1 
            FROM room_borrow_requests 
            WHERE preferred_classroom_id = OLD.classroom_id 
               OR approved_classroom_id = OLD.classroom_id 
            LIMIT 1
       )
       OR EXISTS (
            SELECT 1 
            FROM temporary_room_changes 
            WHERE old_classroom_id = OLD.classroom_id 
               OR requested_classroom_id = OLD.classroom_id 
               OR new_classroom_id = OLD.classroom_id 
            LIMIT 1
       )
       OR EXISTS (
            SELECT 1 
            FROM classroom_issue_reports 
            WHERE classroom_id = OLD.classroom_id 
            LIMIT 1
       )
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể xóa cứng phòng học đã phát sinh dữ liệu liên quan.';
    END IF;
END $$

DROP TRIGGER IF EXISTS trg_schedules_require_active_classroom_insert $$
CREATE TRIGGER trg_schedules_require_active_classroom_insert
BEFORE INSERT ON schedules
FOR EACH ROW
BEGIN
    IF NEW.classroom_id IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM classrooms c
            WHERE c.classroom_id = NEW.classroom_id
              AND c.is_active = TRUE
              AND c.is_deleted = FALSE
            LIMIT 1
       )
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể gán lịch vào phòng học đang bị vô hiệu hóa hoặc đã xóa.';
    END IF;
END $$

DROP TRIGGER IF EXISTS trg_schedules_require_active_classroom_update $$
CREATE TRIGGER trg_schedules_require_active_classroom_update
BEFORE UPDATE ON schedules
FOR EACH ROW
BEGIN
    IF NEW.classroom_id IS NOT NULL
       AND (
            OLD.classroom_id IS NULL
            OR NEW.classroom_id <> OLD.classroom_id
       )
       AND NOT EXISTS (
            SELECT 1
            FROM classrooms c
            WHERE c.classroom_id = NEW.classroom_id
              AND c.is_active = TRUE
              AND c.is_deleted = FALSE
            LIMIT 1
       )
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Không thể gán lịch vào phòng học đang bị vô hiệu hóa hoặc đã xóa.';
    END IF;
END $$

DELIMITER ;

-- =========================================================
-- 4. Sync existing seeded courses after triggers are created
-- =========================================================

UPDATE courses c
SET c.is_active = EXISTS (
    SELECT 1
    FROM class_sections cs
    WHERE cs.course_id = c.course_id
      AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
)
WHERE c.course_id IS NOT NULL;

SET SQL_SAFE_UPDATES = 1;

-- =========================================================
-- 5. Verification
-- =========================================================

SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_NAME = 'sync_course_active_status';

SELECT 
    TRIGGER_NAME,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING,
    EVENT_MANIPULATION
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME;

SELECT 
    c.course_code,
    c.course_name,
    c.is_active,
    COUNT(cs.section_id) AS total_class_sections
FROM courses c
LEFT JOIN class_sections cs ON cs.course_id = c.course_id
GROUP BY 
    c.course_code,
    c.course_name,
    c.is_active
ORDER BY c.course_code;