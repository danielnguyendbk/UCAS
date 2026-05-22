DROP DATABASE IF EXISTS QLPHONGHOC;
CREATE DATABASE QLPHONGHOC CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE QLPHONGHOC;

-- =========================================================
-- HỆ THỐNG PHÂN PHÒNG HỌC DỰA TRÊN THỜI KHÓA BIỂU
-- Bản đã bổ sung:
--   + Bảng classes
--   + students.class_id FK tới classes.id
--   + Seed data đầy đủ
--   + Password user mẫu: 123456
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
-- 3) TỔ CHỨC - KHOA - LỚP - BỘ MÔN
-- -----------------------------
CREATE TABLE faculties (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(120) NOT NULL UNIQUE,
    code         VARCHAR(10)  NOT NULL UNIQUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE classes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id       INT NOT NULL,
    class_code       VARCHAR(20)  NOT NULL UNIQUE,
    class_name       VARCHAR(100) NOT NULL,
    academic_year_id INT NOT NULL,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN  NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_classes_faculty
        FOREIGN KEY (faculty_id) REFERENCES faculties(id),

    CONSTRAINT fk_classes_academic_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
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

-- -----------------------------
-- 4) NHÂN SỰ - SINH VIÊN - CLB
-- -----------------------------
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
    class_id         INT          NOT NULL,
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
        FOREIGN KEY (faculty_id) REFERENCES faculties(id),

    CONSTRAINT fk_students_class
        FOREIGN KEY (class_id) REFERENCES classes(id)
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
-- 5) CƠ SỞ VẬT CHẤT
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
    slot_id     INT AUTO_INCREMENT PRIMARY KEY,
    slot_no     INT NOT NULL,
    slot_label  VARCHAR(20) NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_time_slots_no CHECK (slot_no > 0),
    CONSTRAINT chk_time_slots_time CHECK (end_time > start_time),
    CONSTRAINT uq_time_slots_no UNIQUE (slot_no),
    CONSTRAINT uq_time_slots_label UNIQUE (slot_label)
) ENGINE=InnoDB;

INSERT INTO time_slots (slot_id, slot_no, slot_label, start_time, end_time) VALUES
(1, 1,  'Tiết 1',  '07:00:00', '07:50:00'),
(2, 2,  'Tiết 2',  '07:50:00', '08:40:00'),
(3, 3,  'Tiết 3',  '08:50:00', '09:40:00'),
(4, 4,  'Tiết 4',  '09:40:00', '10:30:00'),
(5, 5,  'Tiết 5',  '13:00:00', '13:50:00'),
(6, 6,  'Tiết 6',  '13:50:00', '14:40:00'),
(7, 7,  'Tiết 7',  '14:50:00', '15:40:00'),
(8, 8,  'Tiết 8',  '15:40:00', '16:30:00'),
(9, 9,  'Tiết 9',  '17:30:00', '18:20:00'),
(10, 10, 'Tiết 10', '18:20:00', '19:10:00'),
(11, 11, 'Tiết 11', '19:20:00', '20:10:00'),
(12, 12, 'Tiết 12', '20:10:00', '21:00:00');

-- -----------------------------
-- 6) LỚP HỌC PHẦN / TKB / GHI DANH
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

CREATE TABLE schedules (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    section_id          INT NOT NULL,
    classroom_id        INT NOT NULL,
    day_of_week         ENUM('MON','TUE','WED','THU','FRI','SAT','SUN') NOT NULL,
    slot_start_id       INT NOT NULL,
    slot_end_id         INT NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    from_week_no        SMALLINT NULL,
    to_week_no          SMALLINT NULL,
    session_type        ENUM('THEORY','PRACTICE') NOT NULL DEFAULT 'THEORY',
    practice_group_no   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    assigned_by         INT NULL,
    assigned_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('ACTIVE','INACTIVE','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    note                VARCHAR(255),

    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_schedules_slot CHECK (slot_end_id >= slot_start_id),
    CONSTRAINT chk_schedules_time CHECK (end_time > start_time),
    CONSTRAINT chk_schedules_from_week CHECK (from_week_no IS NULL OR from_week_no > 0),
    CONSTRAINT chk_schedules_to_week CHECK (
        to_week_no IS NULL OR (from_week_no IS NOT NULL AND to_week_no >= from_week_no)
    ),

    CONSTRAINT uq_schedule_section_slot
        UNIQUE (section_id, day_of_week, slot_start_id, slot_end_id, practice_group_no),

    CONSTRAINT fk_schedules_section
        FOREIGN KEY (section_id) REFERENCES class_sections(id),

    CONSTRAINT fk_schedules_classroom
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),

    CONSTRAINT fk_schedules_slot_start
        FOREIGN KEY (slot_start_id) REFERENCES time_slots(slot_id),

    CONSTRAINT fk_schedules_slot_end
        FOREIGN KEY (slot_end_id) REFERENCES time_slots(slot_id),

    CONSTRAINT fk_schedules_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB;

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
-- 7) ĐỔI PHÒNG TẠM THỜI
-- -----------------------------
CREATE TABLE temporary_room_changes (
    id                       INT AUTO_INCREMENT PRIMARY KEY,

    schedule_id              INT NOT NULL,
    semester_id              INT NOT NULL,
    change_scope             ENUM('SESSION','WEEK_RANGE','REST_OF_SEMESTER') NOT NULL DEFAULT 'SESSION',
    target_date              DATE NULL,
    from_week                SMALLINT NULL,
    to_week                  SMALLINT NULL,
    old_classroom_id         INT NOT NULL,
    requested_classroom_id   INT NULL,
    new_classroom_id         INT NULL,
    reason                   TEXT NOT NULL,
    requested_by             INT NOT NULL,
    created_by               INT NOT NULL,
    status                   ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    reviewed_by              INT NULL,
    reviewed_at              DATETIME NULL,
    review_note              TEXT NULL,
    reject_reason            TEXT NULL,
    is_active                BOOLEAN NOT NULL DEFAULT FALSE,
    created_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CHECK (from_week IS NULL OR from_week > 0),
    CHECK (to_week IS NULL OR (from_week IS NOT NULL AND to_week >= from_week)),
    CHECK (
        (change_scope = 'SESSION' AND target_date IS NOT NULL AND from_week IS NULL AND to_week IS NULL)
        OR
        (change_scope = 'WEEK_RANGE' AND target_date IS NULL AND from_week IS NOT NULL AND to_week IS NOT NULL)
        OR
        (change_scope = 'REST_OF_SEMESTER' AND target_date IS NULL AND from_week IS NOT NULL)
    ),
    CHECK (
        status <> 'APPROVED'
        OR (new_classroom_id IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    ),
    CHECK (
        status <> 'REJECTED'
        OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND reject_reason IS NOT NULL)
    ),
    CONSTRAINT fk_temporary_room_changes_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules(id),

    CONSTRAINT fk_temporary_room_changes_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id),

    CONSTRAINT fk_temporary_room_changes_old_classroom
        FOREIGN KEY (old_classroom_id) REFERENCES classrooms(id),

    CONSTRAINT fk_temporary_room_changes_requested_classroom
        FOREIGN KEY (requested_classroom_id) REFERENCES classrooms(id),

    CONSTRAINT fk_temporary_room_changes_new_classroom
        FOREIGN KEY (new_classroom_id) REFERENCES classrooms(id),

    CONSTRAINT fk_temporary_room_changes_requested_by
        FOREIGN KEY (requested_by) REFERENCES users(id),

    CONSTRAINT fk_temporary_room_changes_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),

    CONSTRAINT fk_temporary_room_changes_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- -----------------------------
-- 8) XIN MƯỢN PHÒNG / DUYỆT YÊU CẦU
-- -----------------------------
CREATE TABLE room_borrow_requests (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    request_title          VARCHAR(200) NOT NULL,
    request_type           ENUM('MAKEUP_CLASS','SEMINAR','WORKSHOP','MEETING','CLUB_ACTIVITY','EVENT','OTHER') NOT NULL,
    booking_scope          ENUM('PERSONAL','CLUB') NOT NULL DEFAULT 'PERSONAL',
    semester_id            INT NOT NULL,
    section_id             INT NULL,
    booking_date           DATE NOT NULL,
    slot_start_id          INT NOT NULL,
    slot_end_id            INT NOT NULL,
    start_time             TIME NOT NULL,
    end_time               TIME NOT NULL,
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
    CHECK (slot_end_id >= slot_start_id),
    CHECK (end_time > start_time),

    CONSTRAINT fk_room_borrow_requests_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id),

    CONSTRAINT fk_room_borrow_requests_section
        FOREIGN KEY (section_id) REFERENCES class_sections(id),

    CONSTRAINT fk_room_borrow_requests_slot_start
        FOREIGN KEY (slot_start_id) REFERENCES time_slots(slot_id),

    CONSTRAINT fk_room_borrow_requests_slot_end
        FOREIGN KEY (slot_end_id) REFERENCES time_slots(slot_id),

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
-- 9) BÁO CÁO SỰ CỐ PHÒNG HỌC
-- -----------------------------
CREATE TABLE classroom_issue_reports (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    classroom_id       INT          NOT NULL,
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
    CONSTRAINT fk_classroom_issue_reports_classroom
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
    CONSTRAINT fk_classroom_issue_reports_reporter
        FOREIGN KEY (reporter_user_id) REFERENCES users(id),
    CONSTRAINT fk_classroom_issue_reports_handled_by
        FOREIGN KEY (handled_by) REFERENCES users(id)
);

-- -----------------------------
-- 10) NHẬT KÝ HỆ THỐNG
-- -----------------------------
CREATE TABLE audit_logs (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NULL,

    action           ENUM(
        'INSERT',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'APPROVE',
        'REJECT',
        'REQUEST',
        'CANCEL',
        'ASSIGN_ROOM',
        'CHANGE_ROOM',
        'GENERATE_SESSION',
        'SCHEDULE_EXAM'
    ) NOT NULL,

    table_name       VARCHAR(60) NOT NULL,
    record_id        BIGINT NULL,

    old_values       JSON NULL,
    new_values       JSON NULL,

    description      VARCHAR(255) NULL,
    ip_address       VARCHAR(45),
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- -----------------------------
-- 11) THỜI KHÓA BIỂU TUẦN
-- -----------------------------
CREATE TABLE semester_weeks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,
    week_no INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_break BOOLEAN NOT NULL DEFAULT FALSE,
    note VARCHAR(255),

    UNIQUE (semester_id, week_no),
    CHECK (end_date >= start_date),

    CONSTRAINT fk_semester_weeks_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- -----------------------------
-- 12) BUỔI HỌC CỤ THỂ
-- -----------------------------
CREATE TABLE class_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NULL,
    section_id INT NOT NULL,
    semester_week_id INT NOT NULL,
    session_date DATE NOT NULL,
    classroom_id INT NULL,
    lecturer_id INT NULL,
    slot_start_id INT NOT NULL,
    slot_end_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_type ENUM('THEORY', 'PRACTICE') NOT NULL DEFAULT 'THEORY',
    practice_group_no TINYINT UNSIGNED NOT NULL DEFAULT 0,
    session_status ENUM(
        'SCHEDULED',
        'CANCELLED',
        'MAKEUP',
        'RESCHEDULED',
        'COMPLETED'
    ) NOT NULL DEFAULT 'SCHEDULED',
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE (section_id, session_date, start_time, end_time, practice_group_no),
    UNIQUE (classroom_id, session_date, start_time, end_time),
    UNIQUE (lecturer_id, session_date, start_time, end_time),

    CONSTRAINT fk_class_sessions_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules(id),

    CONSTRAINT fk_class_sessions_section
        FOREIGN KEY (section_id) REFERENCES class_sections(id),

    CONSTRAINT fk_class_sessions_week
        FOREIGN KEY (semester_week_id) REFERENCES semester_weeks(id),

    CONSTRAINT fk_class_sessions_classroom
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),

    CONSTRAINT fk_class_sessions_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),

    CONSTRAINT fk_class_sessions_slot_start
        FOREIGN KEY (slot_start_id) REFERENCES time_slots(slot_id),

    CONSTRAINT fk_class_sessions_slot_end
        FOREIGN KEY (slot_end_id) REFERENCES time_slots(slot_id),

    CONSTRAINT chk_class_sessions_time CHECK (end_time > start_time),
    CONSTRAINT chk_class_sessions_slot CHECK (slot_end_id >= slot_start_id)
);

-- -----------------------------
-- 13) LỊCH NGHỈ
-- -----------------------------
CREATE TABLE academic_calendar_blocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_id INT NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    block_type ENUM('HOLIDAY','BREAK','EXAM_WEEK','EVENT') NOT NULL,
    title VARCHAR(150) NOT NULL,

    is_teaching_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    note VARCHAR(255),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CHECK (end_date >= start_date),

    CONSTRAINT fk_calendar_blocks_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- -----------------------------
-- 14) LỊCH THI
-- -----------------------------
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,

    semester_id INT NOT NULL,
    section_id INT NOT NULL,
    classroom_id INT NOT NULL,

    proctor_lecturer_id INT NULL,

    exam_type ENUM('MIDTERM','FINAL','MAKEUP','OTHER') NOT NULL,
    exam_method ENUM('WRITTEN','ORAL','PRACTICAL','ONLINE') NULL,

    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    student_count INT NULL,
    seat_range VARCHAR(100) NULL,

    status ENUM('DRAFT','SCHEDULED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    note VARCHAR(255),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CHECK (end_time > start_time),

    CONSTRAINT fk_exams_semester
        FOREIGN KEY (semester_id) REFERENCES semesters(id),

    CONSTRAINT fk_exams_section
        FOREIGN KEY (section_id) REFERENCES class_sections(id),

    CONSTRAINT fk_exams_classroom
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),

    CONSTRAINT fk_exams_proctor
        FOREIGN KEY (proctor_lecturer_id) REFERENCES lecturers(id)
);

-- -----------------------------
-- 15) GIÁM THỊ
-- -----------------------------
CREATE TABLE exam_invigilators (
    exam_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    role ENUM('MAIN','ASSISTANT') NOT NULL DEFAULT 'ASSISTANT',
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (exam_id, lecturer_id),

    CONSTRAINT fk_exam_invigilators_exam
        FOREIGN KEY (exam_id) REFERENCES exams(id),

    CONSTRAINT fk_exam_invigilators_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES lecturers(id)
);

-- -----------------------------
-- 16) INDEX TỐI ƯU TRUY VẤN
-- -----------------------------
CREATE INDEX idx_schedules_section_day_slot
ON schedules(section_id, day_of_week, slot_start_id, slot_end_id);

CREATE INDEX idx_schedules_classroom_day_slot
ON schedules(classroom_id, day_of_week, slot_start_id, slot_end_id);

CREATE INDEX idx_temporary_room_changes_status
ON temporary_room_changes(status, is_active, created_at);

CREATE INDEX idx_temporary_room_changes_requester
ON temporary_room_changes(requested_by, status, created_at);

CREATE INDEX idx_temporary_room_changes_schedule_scope
ON temporary_room_changes(schedule_id, semester_id, change_scope, status, is_active);

CREATE INDEX idx_temporary_room_changes_room_date
ON temporary_room_changes(new_classroom_id, target_date, status, is_active);

CREATE INDEX idx_temporary_room_changes_room_weeks
ON temporary_room_changes(new_classroom_id, semester_id, from_week, to_week, status, is_active);

CREATE INDEX idx_room_borrow_requests_status_date
ON room_borrow_requests(status, booking_date);

CREATE INDEX idx_room_borrow_requests_requester
ON room_borrow_requests(requested_by, status);

CREATE INDEX idx_room_borrow_requests_room_date_time
ON room_borrow_requests(approved_classroom_id, booking_date, start_time, end_time, status);

CREATE INDEX idx_student_section_enrollments_student
ON student_section_enrollments(student_id, status);

CREATE INDEX idx_club_memberships_club_rep
ON club_memberships(club_id, is_representative, is_active);

CREATE INDEX idx_classroom_issue_reports_reporter_status
ON classroom_issue_reports(reporter_user_id, status, created_at);

CREATE INDEX idx_classroom_issue_reports_room_status
ON classroom_issue_reports(classroom_id, status, created_at);

CREATE INDEX idx_classroom_issue_reports_handler_status
ON classroom_issue_reports(handled_by, status);

CREATE INDEX idx_class_sessions_week_date
ON class_sessions(semester_week_id, session_date);

CREATE INDEX idx_class_sessions_classroom_date_time
ON class_sessions(classroom_id, session_date, start_time, end_time);

CREATE INDEX idx_class_sessions_lecturer_date_time
ON class_sessions(lecturer_id, session_date, start_time, end_time);

CREATE INDEX idx_class_sessions_section_date
ON class_sessions(section_id, session_date);

CREATE INDEX idx_exams_room_date_time
ON exams(classroom_id, exam_date, start_time, end_time);

CREATE INDEX idx_exams_section
ON exams(section_id, exam_date);

CREATE INDEX idx_academic_calendar_blocks_semester_date
ON academic_calendar_blocks(semester_id, start_date, end_date);

CREATE INDEX idx_users_role_active
ON users(role, is_active, is_deleted);

CREATE INDEX idx_students_faculty
ON students(faculty_id);

CREATE INDEX idx_students_class
ON students(class_id);

CREATE INDEX idx_lecturers_department
ON lecturers(department_id);

CREATE INDEX idx_class_sections_semester_status
ON class_sections(semester_id, status);

CREATE INDEX idx_class_sections_lecturer
ON class_sections(lecturer_id);

CREATE INDEX idx_classrooms_building_active_type
ON classrooms(building_id, is_active, room_type);

CREATE INDEX idx_classes_faculty
ON classes(faculty_id);

CREATE INDEX idx_classes_academic_year
ON classes(academic_year_id);

-- =========================================================
-- SEED DATA
-- Password mẫu cho toàn bộ user: 123456
-- password_hash bcrypt:
-- $2b$10$eOA7ET5uabA7VKNuyyh0KOJLTPGA3R8Vc/uUBOHLc.emklOXN.0K.
-- =========================================================

SET @password_hash = '$2b$10$eOA7ET5uabA7VKNuyyh0KOJLTPGA3R8Vc/uUBOHLc.emklOXN.0K.';

-- -----------------------------
-- 1) USERS
-- -----------------------------
INSERT INTO users
(id, username, email, password_hash, full_name, role, is_active)
VALUES
(1,  'admin01', 'admin01@ptit.edu.vn', @password_hash, 'System Admin', 'ADMIN', TRUE),
(2,  'staff01', 'staff01@ptit.edu.vn', @password_hash, 'Academic Staff', 'STAFF', TRUE),
(3,  'staff02', 'staff02@ptit.edu.vn', @password_hash, 'Room Scheduler', 'STAFF', TRUE),

(4,  'lect01', 'lect01@ptit.edu.vn', @password_hash, 'Lecturer One', 'LECTURER', TRUE),
(5,  'lect02', 'lect02@ptit.edu.vn', @password_hash, 'Lecturer Two', 'LECTURER', TRUE),
(6,  'lect03', 'lect03@ptit.edu.vn', @password_hash, 'Lecturer Three', 'LECTURER', TRUE),
(7,  'lect04', 'lect04@ptit.edu.vn', @password_hash, 'Lecturer Four', 'LECTURER', TRUE),

(8,  'sv001', 'sv001@ptit.edu.vn', @password_hash, 'Student One', 'STUDENT', TRUE),
(9,  'sv002', 'sv002@ptit.edu.vn', @password_hash, 'Student Two', 'STUDENT', TRUE),
(10, 'sv003', 'sv003@ptit.edu.vn', @password_hash, 'Student Three', 'STUDENT', TRUE),
(11, 'sv004', 'sv004@ptit.edu.vn', @password_hash, 'Student Four', 'STUDENT', TRUE),
(12, 'sv005', 'sv005@ptit.edu.vn', @password_hash, 'Student Five', 'STUDENT', TRUE),

(13, 'fac01', 'fac01@ptit.edu.vn', @password_hash, 'Facility One', 'FACILITY', TRUE),
(14, 'fac02', 'fac02@ptit.edu.vn', @password_hash, 'Facility Two', 'FACILITY', TRUE);

-- -----------------------------
-- 2) ACADEMIC YEARS / SEMESTERS
-- -----------------------------
INSERT INTO academic_years
(id, year_label, start_date, end_date, is_current)
VALUES
(1, '2025-2026', '2025-08-01', '2026-07-31', TRUE),
(2, '2026-2027', '2026-08-01', '2027-07-31', FALSE);

INSERT INTO semesters
(id, academic_year_id, semester_type, semester_name, start_date, end_date, status)
VALUES
(1, 1, 'SPRING', 'Học kỳ 2 năm học 2025-2026', '2026-01-05', '2026-05-31', 'ACTIVE'),
(2, 1, 'SUMMER', 'Học kỳ hè năm học 2025-2026', '2026-06-15', '2026-08-02', 'UPCOMING'),
(3, 2, 'FALL',   'Học kỳ 1 năm học 2026-2027', '2026-08-17', '2026-12-27', 'UPCOMING');

-- -----------------------------
-- 3) FACULTIES / CLASSES / DEPARTMENTS / COURSES
-- -----------------------------
INSERT INTO faculties
(id, name, code)
VALUES
(1, 'Khoa Công nghệ Thông tin', 'CNTT'),
(2, 'Khoa Viễn thông', 'VT'),
(3, 'Khoa Cơ bản', 'CB');

INSERT INTO classes
(id, faculty_id, class_code, class_name, academic_year_id)
VALUES
(1, 1, 'D22CQCN01-N', 'Công nghệ thông tin 1 khóa 2022', 1),
(2, 1, 'D22CQCN02-N', 'Công nghệ thông tin 2 khóa 2022', 1),
(3, 1, 'D22CQCN03-N', 'Công nghệ thông tin 3 khóa 2022', 1),
(4, 2, 'D22CQVT01-N', 'Viễn thông 1 khóa 2022', 1),
(5, 3, 'D22CQCB01-N', 'Lớp cơ bản khóa 2022', 1);

INSERT INTO departments
(id, faculty_id, name, code)
VALUES
(1, 1, 'Bộ môn Công nghệ phần mềm', 'CNPM'),
(2, 1, 'Bộ môn Hệ thống thông tin', 'HTTT'),
(3, 1, 'Bộ môn Mạng máy tính', 'MMT'),
(4, 3, 'Bộ môn Toán', 'TOAN');

INSERT INTO courses
(id, department_id, course_code, course_name, credits, required_room_type, description)
VALUES
(1, 1, 'INT1306', 'Cấu trúc dữ liệu và giải thuật', 3, 'LECTURE', 'Môn học về cấu trúc dữ liệu và thuật toán.'),
(2, 2, 'INT1414', 'Cơ sở dữ liệu', 3, 'LAB', 'Môn học về SQL và thiết kế cơ sở dữ liệu.'),
(3, 1, 'INT2208', 'Công nghệ phần mềm', 3, 'LECTURE', 'Quy trình phát triển phần mềm.'),
(4, 3, 'INT1434', 'Mạng máy tính', 3, 'LAB', 'Mạng máy tính và thực hành cấu hình mạng.'),
(5, 4, 'BAS1203', 'Toán rời rạc 2', 3, 'LECTURE', 'Logic, đồ thị, tổ hợp.'),
(6, 2, 'INT3306', 'Cơ sở dữ liệu phân tán', 3, 'SEMINAR', 'Các mô hình và thuật toán trong CSDL phân tán.');

-- -----------------------------
-- 4) BUILDINGS / CLASSROOMS / FACILITY STAFF
-- -----------------------------
INSERT INTO buildings
(id, name, code)
VALUES
(1, 'Tòa nhà A', 'A'),
(2, 'Tòa nhà B', 'B'),
(3, 'Khu phòng máy', 'LAB');

INSERT INTO classrooms
(id, building_id, floor_number, room_number, room_name, room_type, capacity, has_projector, has_ac, is_active)
VALUES
(1, 1, 1, 'A101', 'Phòng A101', 'LECTURE', 60, TRUE, TRUE, TRUE),
(2, 1, 1, 'A102', 'Phòng A102', 'LECTURE', 80, TRUE, TRUE, TRUE),
(3, 1, 2, 'A201', 'Phòng Seminar A201', 'SEMINAR', 45, TRUE, TRUE, TRUE),
(4, 1, 3, 'A301', 'Hội trường A301', 'AUDITORIUM', 150, TRUE, TRUE, TRUE),
(5, 2, 1, 'B101', 'Phòng B101', 'LECTURE', 70, TRUE, FALSE, TRUE),
(6, 2, 2, 'B201', 'Phòng B201', 'LECTURE', 90, TRUE, TRUE, TRUE),
(7, 3, 1, 'LAB1', 'Phòng máy LAB 1', 'LAB', 40, TRUE, TRUE, TRUE),
(8, 3, 1, 'LAB2', 'Phòng máy LAB 2', 'LAB', 45, TRUE, TRUE, TRUE);

INSERT INTO facility_staff
(id, user_id, staff_code, building_id, note)
VALUES
(1, 13, 'CSVC001', 1, 'Phụ trách mở cửa và kiểm tra thiết bị tòa A.'),
(2, 14, 'CSVC002', 3, 'Phụ trách phòng máy và thiết bị thực hành.');

-- -----------------------------
-- 5) LECTURERS / STUDENTS / CLUBS
-- -----------------------------
INSERT INTO lecturers
(id, user_id, department_id, staff_code, full_name, email, phone)
VALUES
(1, 4, 1, 'GV001', 'Lecturer One', 'lect01@ptit.edu.vn', '0901000001'),
(2, 5, 2, 'GV002', 'Lecturer Two', 'lect02@ptit.edu.vn', '0901000002'),
(3, 6, 3, 'GV003', 'Lecturer Three', 'lect03@ptit.edu.vn', '0901000003'),
(4, 7, 4, 'GV004', 'Lecturer Four', 'lect04@ptit.edu.vn', '0901000004');

INSERT INTO students
(id, user_id, faculty_id, class_id, student_code, class_name, course_year, phone)
VALUES
(1, 8,  1, 1, 'B22DCCN001', 'D22CQCN01-N', 2022, '0912000001'),
(2, 9,  1, 1, 'B22DCCN002', 'D22CQCN01-N', 2022, '0912000002'),
(3, 10, 1, 2, 'B22DCCN003', 'D22CQCN02-N', 2022, '0912000003'),
(4, 11, 1, 3, 'B22DCCN004', 'D22CQCN03-N', 2022, '0912000004'),
(5, 12, 2, 4, 'B22DCVT001', 'D22CQVT01-N', 2022, '0912000005');

INSERT INTO clubs
(id, club_code, club_name, faculty_id, advisor_user_id, status)
VALUES
(1, 'ITC', 'Câu lạc bộ Tin học PTIT', 1, 4, 'ACTIVE'),
(2, 'MEDIA', 'Câu lạc bộ Truyền thông PTIT', NULL, 5, 'ACTIVE');

INSERT INTO club_memberships
(id, club_id, student_id, position_name, is_representative, is_active)
VALUES
(1, 1, 1, 'Chủ nhiệm', TRUE, TRUE),
(2, 1, 2, 'Thành viên', FALSE, TRUE),
(3, 2, 3, 'Trưởng ban', TRUE, TRUE),
(4, 2, 4, 'Thành viên', FALSE, TRUE);

-- -----------------------------
-- 6) CLASS SECTIONS / SCHEDULES / ENROLLMENTS
-- -----------------------------
INSERT INTO class_sections
(id, semester_id, course_id, lecturer_id, section_code, enrolled_count, max_capacity, status)
VALUES
(1, 1, 1, 1, '01', 55, 60, 'ACTIVE'),
(2, 1, 2, 2, '01', 38, 40, 'ACTIVE'),
(3, 1, 3, 1, '01', 70, 80, 'ACTIVE'),
(4, 1, 4, 3, '01', 36, 40, 'ACTIVE'),
(5, 1, 5, 4, '01', 65, 70, 'ACTIVE'),
(6, 1, 6, 2, '01', 42, 45, 'ACTIVE');

INSERT INTO schedules
(id, section_id, classroom_id, day_of_week, slot_start_id, slot_end_id, start_time, end_time,
 from_week_no, to_week_no, session_type, practice_group_no, assigned_by, status, note)
VALUES
(1, 1, 1, 'MON', 1, 2, '07:00:00', '08:40:00', 1, 16, 'THEORY', 0, 2, 'ACTIVE', 'CTDL&GT thứ 2 tiết 1-2'),
(2, 2, 7, 'MON', 3, 4, '08:50:00', '10:30:00', 1, 16, 'PRACTICE', 1, 2, 'ACTIVE', 'Thực hành CSDL'),
(3, 3, 2, 'TUE', 1, 3, '07:00:00', '09:40:00', 1, 16, 'THEORY', 0, 2, 'ACTIVE', 'Công nghệ phần mềm'),
(4, 4, 8, 'TUE', 5, 6, '13:00:00', '14:40:00', 1, 16, 'PRACTICE', 1, 2, 'ACTIVE', 'Thực hành mạng máy tính'),
(5, 5, 5, 'WED', 1, 2, '07:00:00', '08:40:00', 1, 16, 'THEORY', 0, 3, 'ACTIVE', 'Toán rời rạc 2'),
(6, 6, 3, 'THU', 7, 8, '14:50:00', '16:30:00', 1, 16, 'THEORY', 0, 3, 'ACTIVE', 'CSDL phân tán');

INSERT INTO student_section_enrollments
(id, student_id, section_id, status)
VALUES
(1, 1, 1, 'ENROLLED'),
(2, 1, 2, 'ENROLLED'),
(3, 1, 5, 'ENROLLED'),
(4, 1, 6, 'ENROLLED'),
(5, 2, 1, 'ENROLLED'),
(6, 2, 2, 'ENROLLED'),
(7, 2, 3, 'ENROLLED'),
(8, 3, 1, 'ENROLLED'),
(9, 3, 4, 'ENROLLED'),
(10, 4, 3, 'ENROLLED'),
(11, 4, 5, 'ENROLLED'),
(12, 5, 4, 'ENROLLED');

-- -----------------------------
-- 7) SEMESTER WEEKS / CLASS SESSIONS
-- -----------------------------
INSERT INTO semester_weeks
(id, semester_id, week_no, start_date, end_date, is_break, note)
VALUES
(1, 1, 1, '2026-01-05', '2026-01-11', FALSE, 'Tuần 1'),
(2, 1, 2, '2026-01-12', '2026-01-18', FALSE, 'Tuần 2'),
(3, 1, 3, '2026-01-19', '2026-01-25', FALSE, 'Tuần 3'),
(4, 1, 4, '2026-01-26', '2026-02-01', FALSE, 'Tuần 4'),
(5, 1, 5, '2026-02-02', '2026-02-08', TRUE, 'Nghỉ Tết'),
(6, 1, 6, '2026-02-09', '2026-02-15', TRUE, 'Nghỉ Tết'),
(7, 1, 7, '2026-02-16', '2026-02-22', FALSE, 'Tuần 7'),
(8, 1, 8, '2026-02-23', '2026-03-01', FALSE, 'Tuần 8');

INSERT INTO class_sessions
(id, schedule_id, section_id, semester_week_id, session_date, classroom_id, lecturer_id,
 slot_start_id, slot_end_id, start_time, end_time, session_type, practice_group_no, session_status, note)
VALUES
(1, 1, 1, 1, '2026-01-05', 1, 1, 1, 2, '07:00:00', '08:40:00', 'THEORY', 0, 'COMPLETED', 'Buổi 1 CTDL&GT'),
(2, 2, 2, 1, '2026-01-05', 7, 2, 3, 4, '08:50:00', '10:30:00', 'PRACTICE', 1, 'COMPLETED', 'Buổi 1 CSDL'),
(3, 3, 3, 1, '2026-01-06', 2, 1, 1, 3, '07:00:00', '09:40:00', 'THEORY', 0, 'COMPLETED', 'Buổi 1 CNPM'),
(4, 4, 4, 1, '2026-01-06', 8, 3, 5, 6, '13:00:00', '14:40:00', 'PRACTICE', 1, 'COMPLETED', 'Buổi 1 Mạng máy tính'),
(5, 5, 5, 1, '2026-01-07', 5, 4, 1, 2, '07:00:00', '08:40:00', 'THEORY', 0, 'COMPLETED', 'Buổi 1 Toán rời rạc'),
(6, 6, 6, 1, '2026-01-08', 3, 2, 7, 8, '14:50:00', '16:30:00', 'THEORY', 0, 'COMPLETED', 'Buổi 1 CSDL phân tán');

-- -----------------------------
-- 8) TEMPORARY ROOM CHANGES / ROOM BORROW REQUESTS
-- -----------------------------
INSERT INTO temporary_room_changes
(id, schedule_id, semester_id, change_scope, target_date, from_week, to_week,
 old_classroom_id, requested_classroom_id, new_classroom_id, reason,
 requested_by, created_by, status, reviewed_by, reviewed_at, review_note,
 reject_reason, is_active)
VALUES
(1, 1, 1, 'SESSION', '2026-02-23', NULL, NULL,
 1, 2, 2, 'Phòng A101 bảo trì máy chiếu, cần đổi sang A102.',
 4, 4, 'APPROVED', 2, '2026-02-20 09:30:00', 'Đã duyệt đổi sang A102.',
 NULL, TRUE),

(2, 6, 1, 'WEEK_RANGE', NULL, 8, 9,
 3, 4, NULL, 'Lớp cần phòng lớn hơn để seminar.',
 5, 5, 'PENDING', NULL, NULL, NULL,
 NULL, FALSE);

INSERT INTO room_borrow_requests
(id, request_title, request_type, booking_scope, semester_id, section_id, booking_date,
 slot_start_id, slot_end_id, start_time, end_time, requested_by, club_id,
 expected_attendees, preferred_building_id, preferred_classroom_id, requested_room_type,
 purpose_note, status, approved_classroom_id, approved_by, approved_at, processing_note, reject_reason)
VALUES
(1, 'Mượn phòng học bù Cơ sở dữ liệu', 'MAKEUP_CLASS', 'PERSONAL', 1, 2, '2026-03-07',
 1, 2, '07:00:00', '08:40:00', 5, NULL,
 38, 3, 7, 'LAB',
 'Lớp cần học bù do nghỉ đột xuất tuần trước.', 'APPROVED', 7, 2, '2026-03-01 10:00:00',
 'Duyệt phòng LAB1.', NULL),

(2, 'Sinh hoạt CLB Tin học tháng 3', 'CLUB_ACTIVITY', 'CLUB', 1, NULL, '2026-03-14',
 5, 6, '13:00:00', '14:40:00', 8, 1,
 35, 1, 3, 'SEMINAR',
 'CLB tổ chức sinh hoạt chuyên đề Git và GitHub.', 'APPROVED', 3, 2, '2026-03-05 15:20:00',
 'Duyệt phòng A201.', NULL),

(3, 'Workshop kỹ năng thuyết trình', 'WORKSHOP', 'CLUB', 1, NULL, '2026-03-21',
 7, 8, '14:50:00', '16:30:00', 10, 2,
 70, 1, 4, 'AUDITORIUM',
 'CLB truyền thông tổ chức workshop.', 'PENDING', NULL, NULL, NULL,
 NULL, NULL);

-- -----------------------------
-- 9) ISSUE REPORTS / CALENDAR BLOCKS
-- -----------------------------
INSERT INTO classroom_issue_reports
(id, classroom_id, reporter_user_id, issue_title, issue_category, severity_level,
 description, image_url, status, handled_by, handled_at, resolution_note)
VALUES
(1, 1, 4, 'Máy chiếu phòng A101 bị mờ', 'PROJECTOR', 'MEDIUM',
 'Máy chiếu hiển thị mờ, khó nhìn chữ ở cuối lớp.', NULL,
 'IN_PROGRESS', 13, '2026-02-19 08:00:00', 'Đã tiếp nhận, đang kiểm tra.'),

(2, 7, 5, 'Một số máy tính LAB1 không đăng nhập được', 'NETWORK', 'HIGH',
 'Khoảng 5 máy không đăng nhập được vào mạng nội bộ.', NULL,
 'RESOLVED', 14, '2026-02-25 14:30:00', 'Đã cấu hình lại mạng.'),

(3, 6, 6, 'Điều hòa phòng B201 yếu', 'AIR_CONDITIONER', 'LOW',
 'Điều hòa vẫn chạy nhưng làm mát chậm.', NULL,
 'PENDING', NULL, NULL, NULL);

INSERT INTO academic_calendar_blocks
(id, semester_id, start_date, end_date, block_type, title, is_teaching_allowed, note)
VALUES
(1, 1, '2026-02-02', '2026-02-15', 'BREAK', 'Nghỉ Tết Nguyên Đán', FALSE, 'Không tổ chức học chính khóa.'),
(2, 1, '2026-04-30', '2026-05-01', 'HOLIDAY', 'Nghỉ lễ 30/4 và 1/5', FALSE, 'Nghỉ lễ theo lịch nhà trường.'),
(3, 1, '2026-05-18', '2026-05-31', 'EXAM_WEEK', 'Tuần thi cuối kỳ', FALSE, 'Chỉ tổ chức thi theo lịch thi.');

-- -----------------------------
-- 10) EXAMS / INVIGILATORS
-- -----------------------------
INSERT INTO exams
(id, semester_id, section_id, classroom_id, proctor_lecturer_id,
 exam_type, exam_method, exam_date, start_time, end_time,
 student_count, seat_range, status, note)
VALUES
(1, 1, 1, 2, 2, 'MIDTERM', 'WRITTEN', '2026-03-18', '07:00:00', '08:40:00', 55, 'A102-001 đến A102-055', 'SCHEDULED', 'Thi giữa kỳ CTDL&GT.'),
(2, 1, 2, 7, 1, 'MIDTERM', 'PRACTICAL', '2026-03-19', '08:50:00', '10:30:00', 38, 'LAB1-001 đến LAB1-038', 'SCHEDULED', 'Thi thực hành CSDL.'),
(3, 1, 5, 6, 3, 'FINAL', 'WRITTEN', '2026-05-20', '07:00:00', '09:00:00', 65, 'B201-001 đến B201-065', 'DRAFT', 'Dự kiến thi cuối kỳ Toán rời rạc 2.');

INSERT INTO exam_invigilators
(exam_id, lecturer_id, role, note)
VALUES
(1, 2, 'MAIN', 'Giám thị chính'),
(1, 3, 'ASSISTANT', 'Giám thị phụ'),
(2, 1, 'MAIN', 'Giám thị chính phòng máy'),
(2, 4, 'ASSISTANT', 'Hỗ trợ kỹ thuật'),
(3, 3, 'MAIN', 'Dự kiến coi thi');

-- -----------------------------
-- 11) AUDIT LOGS
-- -----------------------------
INSERT INTO audit_logs
(id, user_id, action, table_name, record_id, old_values, new_values, description, ip_address)
VALUES
(1, 1, 'LOGIN', 'users', 1, NULL, NULL, 'Admin đăng nhập hệ thống.', '127.0.0.1'),
(2, 2, 'ASSIGN_ROOM', 'schedules', 1, NULL, JSON_OBJECT('classroom_id', 1, 'section_id', 1), 'Nhân viên phân phòng cho lớp CTDL&GT.', '127.0.0.1'),
(3, 4, 'REQUEST', 'temporary_room_changes', 1, NULL, JSON_OBJECT('schedule_id', 1, 'requested_classroom_id', 2), 'Giảng viên yêu cầu đổi phòng tạm thời.', '127.0.0.1'),
(4, 2, 'APPROVE', 'temporary_room_changes', 1, NULL, JSON_OBJECT('status', 'APPROVED', 'new_classroom_id', 2), 'Nhân viên duyệt đổi phòng tạm thời.', '127.0.0.1'),
(5, 8, 'REQUEST', 'room_borrow_requests', 2, NULL, JSON_OBJECT('club_id', 1, 'status', 'APPROVED'), 'Sinh viên đại diện CLB xin mượn phòng.', '127.0.0.1');

-- -----------------------------
-- 12) KIỂM TRA NHANH SAU KHI INSERT
-- -----------------------------
SELECT 'users' AS table_name, COUNT(*) AS total FROM users
UNION ALL SELECT 'academic_years', COUNT(*) FROM academic_years
UNION ALL SELECT 'semesters', COUNT(*) FROM semesters
UNION ALL SELECT 'faculties', COUNT(*) FROM faculties
UNION ALL SELECT 'classes', COUNT(*) FROM classes
UNION ALL SELECT 'departments', COUNT(*) FROM departments
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'buildings', COUNT(*) FROM buildings
UNION ALL SELECT 'classrooms', COUNT(*) FROM classrooms
UNION ALL SELECT 'lecturers', COUNT(*) FROM lecturers
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'class_sections', COUNT(*) FROM class_sections
UNION ALL SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL SELECT 'class_sessions', COUNT(*) FROM class_sessions;

-- Kiểm tra sinh viên đã liên kết class_id đúng chưa
SELECT 
    s.id,
    s.student_code,
    u.full_name,
    s.class_id,
    c.class_code,
    c.class_name AS class_full_name
FROM students s
JOIN users u ON s.user_id = u.id
JOIN classes c ON s.class_id = c.id
ORDER BY s.id;
