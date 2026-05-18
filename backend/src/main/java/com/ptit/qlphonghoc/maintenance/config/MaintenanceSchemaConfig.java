package com.ptit.qlphonghoc.maintenance.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class MaintenanceSchemaConfig {

    @Bean
    CommandLineRunner maintenanceIssueReportSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            migrateIssueReportsToClassroom(jdbcTemplate);
            recreateIssueReportTriggers(jdbcTemplate);
            recreateIssueReportView(jdbcTemplate);
        };
    }

    private void migrateIssueReportsToClassroom(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_classroom_issue_reports_before_insert");
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_classroom_issue_reports_before_update");

        if (!columnExists(jdbcTemplate, "classroom_issue_reports", "classroom_id")) {
            jdbcTemplate.execute("ALTER TABLE classroom_issue_reports ADD COLUMN classroom_id INT NULL AFTER id");
        }

        boolean hasRoomAllocationId = columnExists(jdbcTemplate, "classroom_issue_reports", "room_allocation_id");
        if (hasRoomAllocationId) {
            jdbcTemplate.update("""
                UPDATE classroom_issue_reports cir
                JOIN room_allocations ra ON ra.id = cir.room_allocation_id
                   SET cir.classroom_id = ra.classroom_id
                 WHERE cir.classroom_id IS NULL
                """);

            if (foreignKeyExists(jdbcTemplate, "classroom_issue_reports", "fk_classroom_issue_reports_room_allocation")) {
                jdbcTemplate.execute("ALTER TABLE classroom_issue_reports DROP FOREIGN KEY fk_classroom_issue_reports_room_allocation");
            }

            if (indexExists(jdbcTemplate, "classroom_issue_reports", "idx_classroom_issue_reports_room_status")) {
                jdbcTemplate.execute("ALTER TABLE classroom_issue_reports DROP INDEX idx_classroom_issue_reports_room_status");
            }
        }

        jdbcTemplate.execute("ALTER TABLE classroom_issue_reports MODIFY classroom_id INT NOT NULL");

        if (hasRoomAllocationId) {
            jdbcTemplate.execute("ALTER TABLE classroom_issue_reports DROP COLUMN room_allocation_id");
        }

        if (!foreignKeyExists(jdbcTemplate, "classroom_issue_reports", "fk_classroom_issue_reports_classroom")) {
            jdbcTemplate.execute("""
                ALTER TABLE classroom_issue_reports
                ADD CONSTRAINT fk_classroom_issue_reports_classroom
                FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
                """);
        }

        if (!indexExists(jdbcTemplate, "classroom_issue_reports", "idx_classroom_issue_reports_room_status")) {
            jdbcTemplate.execute("""
                CREATE INDEX idx_classroom_issue_reports_room_status
                ON classroom_issue_reports(classroom_id, status, created_at)
                """);
        }
    }

    private void recreateIssueReportTriggers(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_classroom_issue_reports_before_insert");
        jdbcTemplate.execute("""
            CREATE TRIGGER trg_classroom_issue_reports_before_insert
            BEFORE INSERT ON classroom_issue_reports
            FOR EACH ROW
            BEGIN
                DECLARE v_reporter_role VARCHAR(20);
                DECLARE v_classroom_active BOOLEAN;
                DECLARE v_handler_role VARCHAR(20);

                SELECT role
                  INTO v_reporter_role
                  FROM users
                 WHERE id = NEW.reporter_user_id
                   AND is_active = TRUE
                   AND is_deleted = FALSE;

                IF v_reporter_role IS NULL THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nguoi bao cao khong hop le hoac da bi vo hieu hoa.';
                END IF;

                IF v_reporter_role NOT IN ('LECTURER','STUDENT','FACILITY') THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chi giang vien, sinh vien hoac nhan vien thiet bi moi duoc tao yeu cau sua chua.';
                END IF;

                SELECT is_active
                  INTO v_classroom_active
                  FROM classrooms
                 WHERE id = NEW.classroom_id;

                IF v_classroom_active IS NULL THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khong tim thay phong hoc tuong ung de tao yeu cau sua chua.';
                END IF;

                IF v_classroom_active = FALSE THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khong the bao cao phong hoc da ngung hoat dong.';
                END IF;

                IF NEW.status IN ('IN_PROGRESS','RESOLVED','REJECTED') AND NEW.handled_by IS NULL THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yeu cau da xu ly phai co nguoi tiep nhan/xu ly.';
                END IF;

                IF NEW.handled_by IS NOT NULL THEN
                    SELECT role
                      INTO v_handler_role
                      FROM users
                     WHERE id = NEW.handled_by
                       AND is_active = TRUE
                       AND is_deleted = FALSE;

                    IF v_handler_role IS NULL OR v_handler_role NOT IN ('ADMIN','STAFF','FACILITY') THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chi ADMIN / STAFF / FACILITY moi duoc xu ly yeu cau sua chua.';
                    END IF;
                END IF;
            END
            """);

        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_classroom_issue_reports_before_update");
        jdbcTemplate.execute("""
            CREATE TRIGGER trg_classroom_issue_reports_before_update
            BEFORE UPDATE ON classroom_issue_reports
            FOR EACH ROW
            BEGIN
                DECLARE v_reporter_role VARCHAR(20);
                DECLARE v_classroom_active BOOLEAN;
                DECLARE v_handler_role VARCHAR(20);

                SELECT role
                  INTO v_reporter_role
                  FROM users
                 WHERE id = NEW.reporter_user_id
                   AND is_active = TRUE
                   AND is_deleted = FALSE;

                IF v_reporter_role IS NULL OR v_reporter_role NOT IN ('LECTURER','STUDENT','FACILITY') THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nguoi bao cao phai la giang vien, sinh vien hoac nhan vien thiet bi hop le.';
                END IF;

                SELECT is_active
                  INTO v_classroom_active
                  FROM classrooms
                 WHERE id = NEW.classroom_id;

                IF v_classroom_active IS NULL THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khong tim thay phong hoc tuong ung de cap nhat yeu cau sua chua.';
                END IF;

                IF v_classroom_active = FALSE THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khong the cap nhat yeu cau tren phong hoc da ngung hoat dong.';
                END IF;

                IF NEW.status IN ('IN_PROGRESS','RESOLVED','REJECTED') THEN
                    IF NEW.handled_by IS NULL THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khi da tiep nhan/xu ly yeu cau, bat buoc phai co handled_by.';
                    END IF;

                    SELECT role
                      INTO v_handler_role
                      FROM users
                     WHERE id = NEW.handled_by
                       AND is_active = TRUE
                       AND is_deleted = FALSE;

                    IF v_handler_role IS NULL OR v_handler_role NOT IN ('ADMIN','STAFF','FACILITY') THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chi ADMIN / STAFF / FACILITY moi duoc xu ly yeu cau sua chua.';
                    END IF;

                    IF NEW.handled_at IS NULL THEN
                        SET NEW.handled_at = CURRENT_TIMESTAMP;
                    END IF;
                END IF;

                IF NEW.status = 'PENDING' THEN
                    SET NEW.handled_by = NULL;
                    SET NEW.handled_at = NULL;
                    SET NEW.resolution_note = NULL;
                END IF;
            END
            """);
    }

    private void recreateIssueReportView(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("""
            CREATE OR REPLACE VIEW v_classroom_issue_reports AS
            SELECT
                cir.id                    AS issue_report_id,
                cir.issue_title,
                cir.issue_category,
                cir.severity_level,
                cir.description,
                cir.image_url,
                cir.status,
                cir.resolution_note,
                cir.created_at            AS reported_at,
                cir.handled_at,
                ru.id                     AS reporter_user_id,
                ru.full_name              AS reporter_name,
                l.staff_code              AS lecturer_code,
                b.code                    AS building_code,
                cr.room_number,
                cr.room_name,
                NULL                      AS semester_name,
                NULL                      AS course_code,
                NULL                      AS course_name,
                NULL                      AS section_code,
                NULL                      AS day_of_week,
                NULL                      AS slot_number,
                NULL                      AS start_time,
                NULL                      AS end_time,
                hu.full_name              AS handled_by_name
            FROM classroom_issue_reports cir
            JOIN users ru                 ON ru.id = cir.reporter_user_id
            LEFT JOIN lecturers l         ON l.user_id = ru.id AND l.is_deleted = FALSE
            JOIN classrooms cr            ON cr.id = cir.classroom_id
            JOIN buildings b              ON b.id = cr.building_id
            LEFT JOIN users hu            ON hu.id = cir.handled_by
            WHERE cir.is_deleted = FALSE
            """);
    }

    private boolean columnExists(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
              FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = ?
               AND column_name = ?
            """, Integer.class, tableName, columnName);
        return count != null && count > 0;
    }

    private boolean indexExists(JdbcTemplate jdbcTemplate, String tableName, String indexName) {
        Integer count = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
              FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = ?
               AND index_name = ?
            """, Integer.class, tableName, indexName);
        return count != null && count > 0;
    }

    private boolean foreignKeyExists(JdbcTemplate jdbcTemplate, String tableName, String constraintName) {
        Integer count = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
              FROM information_schema.table_constraints
             WHERE constraint_schema = DATABASE()
               AND table_name = ?
               AND constraint_name = ?
               AND constraint_type = 'FOREIGN KEY'
            """, Integer.class, tableName, constraintName);
        return count != null && count > 0;
    }
}
