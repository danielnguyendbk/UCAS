DROP DATABASE IF EXISTS QLPHONGHOC;
CREATE DATABASE QLPHONGHOC CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE QLPHONGHOC;

-- =========================================================
-- HỆ THỐNG PHÂN PHÒNG HỌC DỰA TRÊN THỜI KHÓA BIỂU
-- Mở rộng actor: ADMIN, STAFF, LECTURER, STUDENT, FACILITY
-- Hỗ trợ:
--   + Phân phòng học theo thời khóa biểu
--   + Sinh viên / giảng viên xin mượn phòng
--   + Sinh viên đại diện CLB xin mượn phòng
--   + Nhân viên cơ sở vật chất / lao công xem lịch phòng để mở cửa
-- =========================================================

-- -----------------------------
-- 1) TÀI KHOẢN & NGƯỜI DÙNG
-- -----------------------------
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    role            ENUM('ADMIN','STAFF','LECTURER','STUDENT','FACILITY') NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at   DATETIME,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE
);

-- -----------------------------
-- 2) NĂM HỌC / HỌC KỲ
-- -----------------------------
CREATE TABLE academic_years (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    year_label   VARCHAR(9)  NOT NULL UNIQUE,
    start_date   DATE        NOT NULL,
    end_date     DATE        NOT NULL,
    is_current   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted   BOOLEAN     NOT NULL DEFAULT FALSE,
    CHECK (end_date > start_date)
);

CREATE TABLE semesters (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    academic_year_id INT NOT NULL,
    semester_type    ENUM('FALL','SPRING','SUMMER') NOT NULL,
    semester_name    VARCHAR(60) NOT NULL,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    status           ENUM('UPCOMING','ACTIVE','COMPLETED') NOT NULL DEFAULT 'UPCOMING',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN  NOT NULL DEFAULT FALSE,
    UNIQUE (academic_year_id, semester_type),
    CHECK (end_date > start_date),
    CONSTRAINT fk_semesters_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- -----------------------------
-- 3) TỔ CHỨC - NHÂN SỰ - SINH VIÊN - CLB
-- -----------------------------
CREATE TABLE faculties (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(120) NOT NULL UNIQUE,
    code         VARCHAR(10)  NOT NULL UNIQUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE departments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id   INT          NOT NULL,
    name         VARCHAR(120) NOT NULL,
    code         VARCHAR(10)  NOT NULL UNIQUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    UNIQUE (faculty_id, name),
    CONSTRAINT fk_departments_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id)
);

CREATE TABLE courses (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    department_id       INT          NOT NULL,
    course_code         VARCHAR(15)  NOT NULL UNIQUE,
    course_name         VARCHAR(150) NOT NULL,
    credits             SMALLINT     NOT NULL,
    required_room_type  ENUM('LECTURE','LAB','SEMINAR','AUDITORIUM') NOT NULL DEFAULT 'LECTURE',
    description         TEXT,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted          BOOLEAN      NOT NULL DEFAULT FALSE,
    CHECK (credits BETWEEN 1 AND 10),
    CONSTRAINT fk_courses_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE lecturers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL UNIQUE,
    department_id    INT          NOT NULL,
    staff_code       VARCHAR(20)  NOT NULL UNIQUE,
    full_name        VARCHAR(120) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    phone            VARCHAR(20),
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_lecturers_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_lecturers_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE students (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL UNIQUE,
    faculty_id       INT          NOT NULL,
    student_code     VARCHAR(20)  NOT NULL UNIQUE,
    class_name       VARCHAR(50)  NOT NULL,
    course_year      SMALLINT,
    phone            VARCHAR(20),
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_students_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_students_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id)
);

CREATE TABLE facility_staff (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL UNIQUE,
    staff_code       VARCHAR(20)  NOT NULL UNIQUE,
    building_id      INT NULL,
    note             VARCHAR(255),
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE clubs (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    club_code        VARCHAR(20)  NOT NULL UNIQUE,
    club_name        VARCHAR(150) NOT NULL UNIQUE,
    faculty_id       INT NULL,
    advisor_user_id  INT NULL,
    status           ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_clubs_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id),
    CONSTRAINT fk_clubs_advisor_user
        FOREIGN KEY (advisor_user_id) REFERENCES users(id)
);

CREATE TABLE club_memberships (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    club_id              INT NOT NULL,
    student_id           INT NOT NULL,
    position_name        VARCHAR(80),
    is_representative    BOOLEAN NOT NULL DEFAULT FALSE,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (club_id, student_id),
    CONSTRAINT fk_club_memberships_club
        FOREIGN KEY (club_id) REFERENCES clubs(id),
    CONSTRAINT fk_club_memberships_student
        FOREIGN KEY (student_id) REFERENCES students(id)
);

-- -----------------------------
-- 4) CƠ SỞ VẬT CHẤT
-- -----------------------------
CREATE TABLE buildings (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(80) NOT NULL UNIQUE,
    code         VARCHAR(10) NOT NULL UNIQUE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE facility_staff
    ADD CONSTRAINT fk_facility_staff_building
        FOREIGN KEY (building_id) REFERENCES buildings(id);

CREATE TABLE classrooms (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    building_id      INT          NOT NULL,
    floor_number     INT,
    room_number      VARCHAR(10)  NOT NULL,
    room_name        VARCHAR(120),
    room_type        ENUM('LECTURE','LAB','SEMINAR','AUDITORIUM') NOT NULL DEFAULT 'LECTURE',
    capacity         SMALLINT     NOT NULL,
    has_projector    BOOLEAN      NOT NULL DEFAULT FALSE,
    has_ac           BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (building_id, room_number),
    CHECK (capacity > 0),
    CONSTRAINT fk_classrooms_building
        FOREIGN KEY (building_id) REFERENCES buildings(id)
);

CREATE TABLE time_slots (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    slot_number   INT  NOT NULL UNIQUE,
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    CHECK (end_time > start_time)
);

INSERT INTO time_slots (id, slot_number, start_time, end_time) VALUES
(1, 1, '07:00:00', '09:00:00'),
(2, 2, '09:10:00', '11:10:00'),
(3, 3, '13:00:00', '15:00:00'),
(4, 4, '15:10:00', '17:10:00'),
(5, 5, '17:30:00', '19:30:00');

-- -----------------------------
-- 5) LỚP HỌC PHẦN / TKB / GHI DANH
-- -----------------------------
CREATE TABLE class_sections (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    semester_id      INT          NOT NULL,
    course_id        INT          NOT NULL,
    lecturer_id      INT          NOT NULL,
    section_code     VARCHAR(10)  NOT NULL,
    enrolled_count   SMALLINT     NOT NULL DEFAULT 0,
    max_capacity     SMALLINT     NOT NULL,
    status           ENUM('ACTIVE','CANCELLED','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (max_capacity > 0),
    CHECK (enrolled_count >= 0),
    UNIQUE (semester_id, course_id, section_code),
    CONSTRAINT fk_class_sections_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id),
    CONSTRAINT fk_class_sections_course
        FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_class_sections_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES lecturers(id)
);

CREATE TABLE section_schedules (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    section_id       INT NOT NULL,
    day_of_week      ENUM('MON','TUE','WED','THU','FRI','SAT','SUN') NOT NULL,
    time_slot_id     INT NOT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (section_id, day_of_week, time_slot_id),
    CONSTRAINT fk_section_schedules_section
        FOREIGN KEY (section_id) REFERENCES class_sections(id),
    CONSTRAINT fk_section_schedules_time_slot
        FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
);

CREATE TABLE student_section_enrollments (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    student_id       INT NOT NULL,
    section_id       INT NOT NULL,
    status           ENUM('ENROLLED','DROPPED','COMPLETED') NOT NULL DEFAULT 'ENROLLED',
    enrolled_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, section_id),
    CONSTRAINT fk_student_section_enrollments_student
        FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_student_section_enrollments_section
        FOREIGN KEY (section_id) REFERENCES class_sections(id)
);

-- -----------------------------
-- 6) PHÂN PHÒNG THEO THỜI KHÓA BIỂU
-- -----------------------------
CREATE TABLE room_allocations (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id      INT      NOT NULL,
    classroom_id     INT      NOT NULL,
    assigned_by      INT      NOT NULL,
    assigned_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active        BOOLEAN  NOT NULL DEFAULT TRUE,
    note             VARCHAR(255),
    UNIQUE (schedule_id),
    CONSTRAINT fk_room_allocations_schedule
        FOREIGN KEY (schedule_id) REFERENCES section_schedules(id),
    CONSTRAINT fk_room_allocations_classroom
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
    CONSTRAINT fk_room_allocations_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- -----------------------------
-- 7) XIN MƯỢN PHÒNG / DUYỆT YÊU CẦU
-- -----------------------------
CREATE TABLE room_borrow_requests (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    request_title          VARCHAR(200) NOT NULL,
    request_type           ENUM('MAKEUP_CLASS','SEMINAR','WORKSHOP','MEETING','CLUB_ACTIVITY','OTHER') NOT NULL,
    booking_scope          ENUM('PERSONAL','CLUB') NOT NULL DEFAULT 'PERSONAL',
    semester_id            INT NOT NULL,
    booking_date           DATE NOT NULL,
    time_slot_id           INT NOT NULL,
    requested_by           INT NOT NULL,
    club_id                INT NULL,
    expected_attendees     SMALLINT NOT NULL,
    preferred_building_id  INT NULL,
    preferred_classroom_id INT NULL,
    requested_room_type    ENUM('LECTURE','LAB','SEMINAR','AUDITORIUM') NULL,
    purpose_note           TEXT,
    status                 ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    approved_classroom_id  INT NULL,
    approved_by            INT NULL,
    approved_at            DATETIME NULL,
    processing_note        TEXT,
    reject_reason          TEXT,
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (expected_attendees > 0),
    CONSTRAINT fk_room_borrow_requests_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id),
    CONSTRAINT fk_room_borrow_requests_time_slot
        FOREIGN KEY (time_slot_id) REFERENCES time_slots(id),
    CONSTRAINT fk_room_borrow_requests_requested_by
        FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_room_borrow_requests_club
        FOREIGN KEY (club_id) REFERENCES clubs(id),
    CONSTRAINT fk_room_borrow_requests_preferred_building
        FOREIGN KEY (preferred_building_id) REFERENCES buildings(id),
    CONSTRAINT fk_room_borrow_requests_preferred_classroom
        FOREIGN KEY (preferred_classroom_id) REFERENCES classrooms(id),
    CONSTRAINT fk_room_borrow_requests_approved_classroom
        FOREIGN KEY (approved_classroom_id) REFERENCES classrooms(id),
    CONSTRAINT fk_room_borrow_requests_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
);


-- -----------------------------
-- 8) BÁO CÁO SỰ CỐ PHÒNG HỌC (GIẢNG VIÊN)
-- -----------------------------
CREATE TABLE classroom_issue_reports (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    room_allocation_id INT          NOT NULL,
    reporter_user_id   INT          NOT NULL,
    issue_title        VARCHAR(200) NOT NULL,
    issue_category     ENUM('PROJECTOR','AIR_CONDITIONER','LIGHT','FAN','DOOR','DESK_CHAIR','ELECTRICAL','NETWORK','CLEANLINESS','OTHER') NOT NULL DEFAULT 'OTHER',
    severity_level     ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
    description        TEXT         NOT NULL,
    image_url          VARCHAR(255),
    status             ENUM('PENDING','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    handled_by         INT NULL,
    handled_at         DATETIME NULL,
    resolution_note    TEXT,
    created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_classroom_issue_reports_room_allocation
        FOREIGN KEY (room_allocation_id) REFERENCES room_allocations(id),
    CONSTRAINT fk_classroom_issue_reports_reporter
        FOREIGN KEY (reporter_user_id) REFERENCES users(id),
    CONSTRAINT fk_classroom_issue_reports_handled_by
        FOREIGN KEY (handled_by) REFERENCES users(id)
);

-- -----------------------------
-- 9) NHẬT KÝ HỆ THỐNG
-- -----------------------------

CREATE TABLE audit_logs (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NULL,
    action           ENUM('INSERT','UPDATE','DELETE','LOGIN','APPROVE','REJECT','REQUEST','CANCEL') NOT NULL,
    table_name       VARCHAR(60) NOT NULL,
    record_id        INT NULL,
    old_values       JSON,
    new_values       JSON,
    ip_address       VARCHAR(45),
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- -----------------------------
-- 10) INDEX TỐI ƯU TRUY VẤN NÓNG
-- -----------------------------
CREATE INDEX idx_users_role_active ON users(role, is_active, is_deleted);
CREATE INDEX idx_students_faculty ON students(faculty_id);
CREATE INDEX idx_lecturers_department ON lecturers(department_id);
CREATE INDEX idx_class_sections_semester_status ON class_sections(semester_id, status);
CREATE INDEX idx_class_sections_lecturer ON class_sections(lecturer_id);
CREATE INDEX idx_section_schedules_day_slot ON section_schedules(day_of_week, time_slot_id);
CREATE INDEX idx_classrooms_building_active_type ON classrooms(building_id, is_active, room_type);
CREATE INDEX idx_room_allocations_classroom_active ON room_allocations(classroom_id, is_active);
CREATE INDEX idx_room_borrow_requests_status_date ON room_borrow_requests(status, booking_date);
CREATE INDEX idx_room_borrow_requests_requester ON room_borrow_requests(requested_by, status);
CREATE INDEX idx_room_borrow_requests_room_date_slot ON room_borrow_requests(approved_classroom_id, booking_date, time_slot_id, status);
CREATE INDEX idx_student_section_enrollments_student ON student_section_enrollments(student_id, status);
CREATE INDEX idx_club_memberships_club_rep ON club_memberships(club_id, is_representative, is_active);
CREATE INDEX idx_classroom_issue_reports_reporter_status ON classroom_issue_reports(reporter_user_id, status, created_at);
CREATE INDEX idx_classroom_issue_reports_room_status ON classroom_issue_reports(room_allocation_id, status, created_at);
CREATE INDEX idx_classroom_issue_reports_handler_status ON classroom_issue_reports(handled_by, status);

-- -----------------------------
-- 11) TRIGGER KIỂM TRA NGHIỆP VỤ
-- -----------------------------
DELIMITER $$

CREATE TRIGGER trg_room_allocations_before_insert
BEFORE INSERT ON room_allocations
FOR EACH ROW
BEGIN
    DECLARE v_semester_id INT;
    DECLARE v_day_of_week VARCHAR(3);
    DECLARE v_time_slot_id INT;
    DECLARE v_enrolled_count INT;
    DECLARE v_required_room_type VARCHAR(20);
    DECLARE v_room_capacity INT;
    DECLARE v_room_type VARCHAR(20);
    DECLARE v_room_active BOOLEAN;

    SELECT cs.semester_id,
           ss.day_of_week,
           ss.time_slot_id,
           cs.enrolled_count,
           c.required_room_type
      INTO v_semester_id, v_day_of_week, v_time_slot_id, v_enrolled_count, v_required_room_type
      FROM section_schedules ss
      JOIN class_sections cs ON cs.id = ss.section_id
      JOIN courses c ON c.id = cs.course_id
     WHERE ss.id = NEW.schedule_id;

    SELECT capacity, room_type, is_active
      INTO v_room_capacity, v_room_type, v_room_active
      FROM classrooms
     WHERE id = NEW.classroom_id;

    IF v_room_active = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng học đang không hoạt động.';
    END IF;

    IF v_room_capacity < v_enrolled_count THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sức chứa phòng nhỏ hơn số sinh viên đăng ký.';
    END IF;

    IF v_room_type <> v_required_room_type THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loại phòng không phù hợp với yêu cầu của môn học.';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM room_allocations ra
          JOIN section_schedules ss2 ON ss2.id = ra.schedule_id
          JOIN class_sections cs2 ON cs2.id = ss2.section_id
         WHERE ra.classroom_id = NEW.classroom_id
           AND ra.is_active = TRUE
           AND cs2.semester_id = v_semester_id
           AND ss2.day_of_week = v_day_of_week
           AND ss2.time_slot_id = v_time_slot_id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng đã được phân cho lớp khác ở cùng thứ/tiết trong học kỳ.';
    END IF;
END$$

CREATE TRIGGER trg_room_allocations_before_update
BEFORE UPDATE ON room_allocations
FOR EACH ROW
BEGIN
    DECLARE v_semester_id INT;
    DECLARE v_day_of_week VARCHAR(3);
    DECLARE v_time_slot_id INT;
    DECLARE v_enrolled_count INT;
    DECLARE v_required_room_type VARCHAR(20);
    DECLARE v_room_capacity INT;
    DECLARE v_room_type VARCHAR(20);
    DECLARE v_room_active BOOLEAN;

    IF NEW.is_active = TRUE THEN
        SELECT cs.semester_id,
               ss.day_of_week,
               ss.time_slot_id,
               cs.enrolled_count,
               c.required_room_type
          INTO v_semester_id, v_day_of_week, v_time_slot_id, v_enrolled_count, v_required_room_type
          FROM section_schedules ss
          JOIN class_sections cs ON cs.id = ss.section_id
          JOIN courses c ON c.id = cs.course_id
         WHERE ss.id = NEW.schedule_id;

        SELECT capacity, room_type, is_active
          INTO v_room_capacity, v_room_type, v_room_active
          FROM classrooms
         WHERE id = NEW.classroom_id;

        IF v_room_active = FALSE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng học đang không hoạt động.';
        END IF;

        IF v_room_capacity < v_enrolled_count THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Sức chứa phòng nhỏ hơn số sinh viên đăng ký.';
        END IF;

        IF v_room_type <> v_required_room_type THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loại phòng không phù hợp với yêu cầu của môn học.';
        END IF;

        IF EXISTS (
            SELECT 1
              FROM room_allocations ra
              JOIN section_schedules ss2 ON ss2.id = ra.schedule_id
              JOIN class_sections cs2 ON cs2.id = ss2.section_id
             WHERE ra.id <> NEW.id
               AND ra.classroom_id = NEW.classroom_id
               AND ra.is_active = TRUE
               AND cs2.semester_id = v_semester_id
               AND ss2.day_of_week = v_day_of_week
               AND ss2.time_slot_id = v_time_slot_id
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng đã được phân cho lớp khác ở cùng thứ/tiết trong học kỳ.';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_room_borrow_requests_before_insert
BEFORE INSERT ON room_borrow_requests
FOR EACH ROW
BEGIN
    DECLARE v_sem_start DATE;
    DECLARE v_sem_end DATE;
    DECLARE v_requester_role VARCHAR(20);
    DECLARE v_student_id INT;
    DECLARE v_mysql_dow INT;
    DECLARE v_day_of_week VARCHAR(3);
    DECLARE v_room_capacity INT;
    DECLARE v_room_active BOOLEAN;
    DECLARE v_room_type VARCHAR(20);

    SELECT start_date, end_date
      INTO v_sem_start, v_sem_end
      FROM semesters
     WHERE id = NEW.semester_id;

    IF NEW.booking_date < v_sem_start OR NEW.booking_date > v_sem_end THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ngày mượn phòng phải nằm trong học kỳ đã chọn.';
    END IF;

    SELECT role INTO v_requester_role
      FROM users
     WHERE id = NEW.requested_by
       AND is_active = TRUE
       AND is_deleted = FALSE;

    IF v_requester_role IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người yêu cầu không hợp lệ hoặc đã bị vô hiệu hóa.';
    END IF;

    IF NEW.booking_scope = 'CLUB' THEN
        IF NEW.club_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu theo CLB bắt buộc phải có club_id.';
        END IF;

        IF v_requester_role <> 'STUDENT' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ sinh viên đại diện CLB mới được tạo yêu cầu theo CLB.';
        END IF;

        SELECT s.id INTO v_student_id
          FROM students s
         WHERE s.user_id = NEW.requested_by
           AND s.is_deleted = FALSE;

        IF v_student_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không tìm thấy hồ sơ sinh viên của người yêu cầu.';
        END IF;

        IF NOT EXISTS (
            SELECT 1
              FROM club_memberships cm
             WHERE cm.club_id = NEW.club_id
               AND cm.student_id = v_student_id
               AND cm.is_representative = TRUE
               AND cm.is_active = TRUE
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người yêu cầu không phải là đại diện CLB hợp lệ.';
        END IF;
    ELSE
        IF NEW.club_id IS NOT NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu cá nhân không được gắn club_id.';
        END IF;
    END IF;

    IF NEW.status = 'APPROVED' THEN
        IF NEW.approved_classroom_id IS NULL OR NEW.approved_by IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu đã duyệt phải có người duyệt và phòng được duyệt.';
        END IF;

        SELECT capacity, is_active, room_type
          INTO v_room_capacity, v_room_active, v_room_type
          FROM classrooms
         WHERE id = NEW.approved_classroom_id;

        IF v_room_active = FALSE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt hiện không hoạt động.';
        END IF;

        IF v_room_capacity < NEW.expected_attendees THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt không đủ sức chứa.';
        END IF;

        IF NEW.requested_room_type IS NOT NULL AND v_room_type <> NEW.requested_room_type THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loại phòng được duyệt không đúng với yêu cầu.';
        END IF;

        SET v_mysql_dow = DAYOFWEEK(NEW.booking_date);
        SET v_day_of_week = CASE v_mysql_dow
            WHEN 1 THEN 'SUN'
            WHEN 2 THEN 'MON'
            WHEN 3 THEN 'TUE'
            WHEN 4 THEN 'WED'
            WHEN 5 THEN 'THU'
            WHEN 6 THEN 'FRI'
            WHEN 7 THEN 'SAT'
        END;

        IF EXISTS (
            SELECT 1
              FROM room_allocations ra
              JOIN section_schedules ss ON ss.id = ra.schedule_id
              JOIN class_sections cs ON cs.id = ss.section_id
             WHERE ra.classroom_id = NEW.approved_classroom_id
               AND ra.is_active = TRUE
               AND cs.semester_id = NEW.semester_id
               AND ss.day_of_week = v_day_of_week
               AND ss.time_slot_id = NEW.time_slot_id
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt đang trùng với lịch học chính khóa.';
        END IF;

        IF EXISTS (
            SELECT 1
              FROM room_borrow_requests rbr
             WHERE rbr.approved_classroom_id = NEW.approved_classroom_id
               AND rbr.booking_date = NEW.booking_date
               AND rbr.time_slot_id = NEW.time_slot_id
               AND rbr.status = 'APPROVED'
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt đã có yêu cầu khác trùng ngày/tiết.';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_room_borrow_requests_before_update
BEFORE UPDATE ON room_borrow_requests
FOR EACH ROW
BEGIN
    DECLARE v_sem_start DATE;
    DECLARE v_sem_end DATE;
    DECLARE v_requester_role VARCHAR(20);
    DECLARE v_student_id INT;
    DECLARE v_mysql_dow INT;
    DECLARE v_day_of_week VARCHAR(3);
    DECLARE v_room_capacity INT;
    DECLARE v_room_active BOOLEAN;
    DECLARE v_room_type VARCHAR(20);

    SELECT start_date, end_date
      INTO v_sem_start, v_sem_end
      FROM semesters
     WHERE id = NEW.semester_id;

    IF NEW.booking_date < v_sem_start OR NEW.booking_date > v_sem_end THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ngày mượn phòng phải nằm trong học kỳ đã chọn.';
    END IF;

    SELECT role INTO v_requester_role
      FROM users
     WHERE id = NEW.requested_by
       AND is_active = TRUE
       AND is_deleted = FALSE;

    IF v_requester_role IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người yêu cầu không hợp lệ hoặc đã bị vô hiệu hóa.';
    END IF;

    IF NEW.booking_scope = 'CLUB' THEN
        IF NEW.club_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu theo CLB bắt buộc phải có club_id.';
        END IF;

        IF v_requester_role <> 'STUDENT' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ sinh viên đại diện CLB mới được tạo yêu cầu theo CLB.';
        END IF;

        SELECT s.id INTO v_student_id
          FROM students s
         WHERE s.user_id = NEW.requested_by
           AND s.is_deleted = FALSE;

        IF v_student_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không tìm thấy hồ sơ sinh viên của người yêu cầu.';
        END IF;

        IF NOT EXISTS (
            SELECT 1
              FROM club_memberships cm
             WHERE cm.club_id = NEW.club_id
               AND cm.student_id = v_student_id
               AND cm.is_representative = TRUE
               AND cm.is_active = TRUE
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người yêu cầu không phải là đại diện CLB hợp lệ.';
        END IF;
    ELSE
        IF NEW.club_id IS NOT NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu cá nhân không được gắn club_id.';
        END IF;
    END IF;

    IF NEW.status = 'APPROVED' THEN
        IF NEW.approved_classroom_id IS NULL OR NEW.approved_by IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Yêu cầu đã duyệt phải có người duyệt và phòng được duyệt.';
        END IF;

        SELECT capacity, is_active, room_type
          INTO v_room_capacity, v_room_active, v_room_type
          FROM classrooms
         WHERE id = NEW.approved_classroom_id;

        IF v_room_active = FALSE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt hiện không hoạt động.';
        END IF;

        IF v_room_capacity < NEW.expected_attendees THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt không đủ sức chứa.';
        END IF;

        IF NEW.requested_room_type IS NOT NULL AND v_room_type <> NEW.requested_room_type THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loại phòng được duyệt không đúng với yêu cầu.';
        END IF;

        SET v_mysql_dow = DAYOFWEEK(NEW.booking_date);
        SET v_day_of_week = CASE v_mysql_dow
            WHEN 1 THEN 'SUN'
            WHEN 2 THEN 'MON'
            WHEN 3 THEN 'TUE'
            WHEN 4 THEN 'WED'
            WHEN 5 THEN 'THU'
            WHEN 6 THEN 'FRI'
            WHEN 7 THEN 'SAT'
        END;

        IF EXISTS (
            SELECT 1
              FROM room_allocations ra
              JOIN section_schedules ss ON ss.id = ra.schedule_id
              JOIN class_sections cs ON cs.id = ss.section_id
             WHERE ra.classroom_id = NEW.approved_classroom_id
               AND ra.is_active = TRUE
               AND cs.semester_id = NEW.semester_id
               AND ss.day_of_week = v_day_of_week
               AND ss.time_slot_id = NEW.time_slot_id
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt đang trùng với lịch học chính khóa.';
        END IF;

        IF EXISTS (
            SELECT 1
              FROM room_borrow_requests rbr
             WHERE rbr.id <> NEW.id
               AND rbr.approved_classroom_id = NEW.approved_classroom_id
               AND rbr.booking_date = NEW.booking_date
               AND rbr.time_slot_id = NEW.time_slot_id
               AND rbr.status = 'APPROVED'
        ) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phòng được duyệt đã có yêu cầu khác trùng ngày/tiết.';
        END IF;
    END IF;
END$$


CREATE TRIGGER trg_classroom_issue_reports_before_insert
BEFORE INSERT ON classroom_issue_reports
FOR EACH ROW
BEGIN
    DECLARE v_reporter_role VARCHAR(20);
    DECLARE v_schedule_lecturer_user_id INT;
    DECLARE v_room_allocation_active BOOLEAN;

    SELECT role
      INTO v_reporter_role
      FROM users
     WHERE id = NEW.reporter_user_id
       AND is_active = TRUE
       AND is_deleted = FALSE;

    IF v_reporter_role IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người báo cáo không hợp lệ hoặc đã bị vô hiệu hóa.';
    END IF;

    IF v_reporter_role <> 'LECTURER' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ giảng viên mới được tạo báo cáo sự cố phòng học.';
    END IF;

    SELECT l.user_id, ra.is_active
      INTO v_schedule_lecturer_user_id, v_room_allocation_active
      FROM room_allocations ra
      JOIN section_schedules ss ON ss.id = ra.schedule_id
      JOIN class_sections cs ON cs.id = ss.section_id
      JOIN lecturers l ON l.id = cs.lecturer_id
     WHERE ra.id = NEW.room_allocation_id;

    IF v_schedule_lecturer_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không tìm thấy lịch phân phòng tương ứng để tạo báo cáo sự cố.';
    END IF;

    IF v_room_allocation_active = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không thể báo cáo trên phân phòng đã ngừng hiệu lực.';
    END IF;

    IF v_schedule_lecturer_user_id <> NEW.reporter_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Giảng viên chỉ được báo cáo sự cố cho phòng học thuộc lịch giảng dạy của mình.';
    END IF;

    IF NEW.status IN ('IN_PROGRESS','RESOLVED','REJECTED') AND NEW.handled_by IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Báo cáo đã xử lý phải có người tiếp nhận/xử lý.';
    END IF;
END$$

CREATE TRIGGER trg_classroom_issue_reports_before_update
BEFORE UPDATE ON classroom_issue_reports
FOR EACH ROW
BEGIN
    DECLARE v_reporter_role VARCHAR(20);
    DECLARE v_schedule_lecturer_user_id INT;
    DECLARE v_room_allocation_active BOOLEAN;
    DECLARE v_handler_role VARCHAR(20);

    SELECT role
      INTO v_reporter_role
      FROM users
     WHERE id = NEW.reporter_user_id
       AND is_active = TRUE
       AND is_deleted = FALSE;

    IF v_reporter_role IS NULL OR v_reporter_role <> 'LECTURER' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Người báo cáo phải là giảng viên hợp lệ.';
    END IF;

    SELECT l.user_id, ra.is_active
      INTO v_schedule_lecturer_user_id, v_room_allocation_active
      FROM room_allocations ra
      JOIN section_schedules ss ON ss.id = ra.schedule_id
      JOIN class_sections cs ON cs.id = ss.section_id
      JOIN lecturers l ON l.id = cs.lecturer_id
     WHERE ra.id = NEW.room_allocation_id;

    IF v_schedule_lecturer_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không tìm thấy lịch phân phòng tương ứng để cập nhật báo cáo sự cố.';
    END IF;

    IF v_room_allocation_active = FALSE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Không thể cập nhật báo cáo trên phân phòng đã ngừng hiệu lực.';
    END IF;

    IF v_schedule_lecturer_user_id <> NEW.reporter_user_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Giảng viên chỉ được gắn với báo cáo thuộc lịch giảng dạy của mình.';
    END IF;

    IF NEW.status IN ('IN_PROGRESS','RESOLVED','REJECTED') THEN
        IF NEW.handled_by IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Khi đã tiếp nhận/xử lý báo cáo, bắt buộc phải có handled_by.';
        END IF;

        SELECT role
          INTO v_handler_role
          FROM users
         WHERE id = NEW.handled_by
           AND is_active = TRUE
           AND is_deleted = FALSE;

        IF v_handler_role IS NULL OR v_handler_role NOT IN ('ADMIN','STAFF','FACILITY') THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chỉ ADMIN / STAFF / FACILITY mới được xử lý báo cáo sự cố.';
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
END$$

DELIMITER ;

-- -----------------------------
-- 12) VIEW PHỤC VỤ TRA CỨU
-- -----------------------------

CREATE OR REPLACE VIEW v_student_timetable AS
SELECT
    s.id                    AS student_id,
    u.full_name             AS student_name,
    s.student_code,
    sem.id                  AS semester_id,
    sem.semester_name,
    c.course_code,
    c.course_name,
    cs.section_code,
    ss.day_of_week,
    ts.slot_number,
    ts.start_time,
    ts.end_time,
    b.code                  AS building_code,
    cr.room_number,
    l.full_name             AS lecturer_name
FROM student_section_enrollments sse
JOIN students s               ON s.id = sse.student_id
JOIN users u                  ON u.id = s.user_id
JOIN class_sections cs        ON cs.id = sse.section_id
JOIN semesters sem            ON sem.id = cs.semester_id
JOIN courses c                ON c.id = cs.course_id
JOIN lecturers l              ON l.id = cs.lecturer_id
JOIN section_schedules ss     ON ss.section_id = cs.id
LEFT JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
LEFT JOIN classrooms cr       ON cr.id = ra.classroom_id
LEFT JOIN buildings b         ON b.id = cr.building_id
LEFT JOIN time_slots ts       ON ts.id = ss.time_slot_id
WHERE sse.status = 'ENROLLED'
  AND cs.status = 'ACTIVE'
  AND sem.is_deleted = FALSE;

CREATE OR REPLACE VIEW v_lecturer_timetable AS
SELECT
    l.id                     AS lecturer_id,
    u.full_name              AS lecturer_name,
    l.staff_code,
    sem.id                   AS semester_id,
    sem.semester_name,
    c.course_code,
    c.course_name,
    cs.section_code,
    ss.day_of_week,
    ts.slot_number,
    ts.start_time,
    ts.end_time,
    b.code                   AS building_code,
    cr.room_number
FROM class_sections cs
JOIN lecturers l             ON l.id = cs.lecturer_id
JOIN users u                 ON u.id = l.user_id
JOIN semesters sem           ON sem.id = cs.semester_id
JOIN courses c               ON c.id = cs.course_id
JOIN section_schedules ss    ON ss.section_id = cs.id
LEFT JOIN room_allocations ra ON ra.schedule_id = ss.id AND ra.is_active = TRUE
LEFT JOIN classrooms cr      ON cr.id = ra.classroom_id
LEFT JOIN buildings b        ON b.id = cr.building_id
LEFT JOIN time_slots ts      ON ts.id = ss.time_slot_id
WHERE cs.status = 'ACTIVE'
  AND sem.is_deleted = FALSE;

CREATE OR REPLACE VIEW v_room_operation_schedule AS
SELECT
    'CLASS'                  AS source_type,
    sem.id                   AS semester_id,
    sem.semester_name,
    NULL                     AS booking_date,
    ss.day_of_week           AS day_of_week,
    ts.slot_number,
    ts.start_time,
    ts.end_time,
    b.code                   AS building_code,
    cr.room_number,
    c.course_code            AS title_code,
    CONCAT(c.course_name, ' - ', cs.section_code) AS title_name,
    l.full_name              AS owner_name,
    ra.classroom_id          AS classroom_id
FROM room_allocations ra
JOIN section_schedules ss    ON ss.id = ra.schedule_id
JOIN class_sections cs       ON cs.id = ss.section_id
JOIN semesters sem           ON sem.id = cs.semester_id
JOIN courses c               ON c.id = cs.course_id
JOIN lecturers l             ON l.id = cs.lecturer_id
JOIN classrooms cr           ON cr.id = ra.classroom_id
JOIN buildings b             ON b.id = cr.building_id
JOIN time_slots ts           ON ts.id = ss.time_slot_id
WHERE ra.is_active = TRUE
  AND cs.status = 'ACTIVE'
UNION ALL
SELECT
    'BORROW_REQUEST'         AS source_type,
    sem.id                   AS semester_id,
    sem.semester_name,
    rbr.booking_date         AS booking_date,
    CASE DAYOFWEEK(rbr.booking_date)
        WHEN 1 THEN 'SUN'
        WHEN 2 THEN 'MON'
        WHEN 3 THEN 'TUE'
        WHEN 4 THEN 'WED'
        WHEN 5 THEN 'THU'
        WHEN 6 THEN 'FRI'
        WHEN 7 THEN 'SAT'
    END                      AS day_of_week,
    ts.slot_number,
    ts.start_time,
    ts.end_time,
    b.code                   AS building_code,
    cr.room_number,
    NULL                     AS title_code,
    rbr.request_title        AS title_name,
    u.full_name              AS owner_name,
    rbr.approved_classroom_id AS classroom_id
FROM room_borrow_requests rbr
JOIN semesters sem           ON sem.id = rbr.semester_id
JOIN classrooms cr           ON cr.id = rbr.approved_classroom_id
JOIN buildings b             ON b.id = cr.building_id
JOIN users u                 ON u.id = rbr.requested_by
JOIN time_slots ts           ON ts.id = rbr.time_slot_id
WHERE rbr.status = 'APPROVED';


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
    sem.semester_name,
    c.course_code,
    c.course_name,
    cs.section_code,
    ss.day_of_week,
    ts.slot_number,
    ts.start_time,
    ts.end_time,
    hu.full_name              AS handled_by_name
FROM classroom_issue_reports cir
JOIN users ru                 ON ru.id = cir.reporter_user_id
JOIN room_allocations ra      ON ra.id = cir.room_allocation_id
JOIN section_schedules ss     ON ss.id = ra.schedule_id
JOIN class_sections cs        ON cs.id = ss.section_id
JOIN semesters sem            ON sem.id = cs.semester_id
JOIN courses c                ON c.id = cs.course_id
JOIN lecturers l              ON l.id = cs.lecturer_id
JOIN classrooms cr            ON cr.id = ra.classroom_id
JOIN buildings b              ON b.id = cr.building_id
JOIN time_slots ts            ON ts.id = ss.time_slot_id
LEFT JOIN users hu            ON hu.id = cir.handled_by
WHERE cir.is_deleted = FALSE;
