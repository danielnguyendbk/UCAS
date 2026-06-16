DROP DATABASE IF EXISTS QLPHONGHOC1;
CREATE DATABASE QLPHONGHOC1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE QLPHONGHOC1;

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
-- 6.1) DOI PHONG TAM THOI / YEU CAU DOI PHONG
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
-- 7) XIN MƯỢN PHÒNG / DUYỆT YÊU CẦU
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
-- 8) BÁO CÁO SỰ CỐ PHÒNG HỌC (GIẢNG VIÊN)
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
-- 9) NHẬT KÝ HỆ THỐNG
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
-- 10) THỜI KHÓA BIỂU TUẦN
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
-- 11) BUỔI HỌC CỤ THỂ
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
-- 12) LỊCH NGHỈ
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
-- 13) LỊCH THI
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
-- 14) GIÁM THỊ
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
-- 10) INDEX TỐI ƯU TRUY VẤN NÓNG
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

CREATE INDEX idx_lecturers_department
ON lecturers(department_id);

CREATE INDEX idx_class_sections_semester_status
ON class_sections(semester_id, status);

CREATE INDEX idx_class_sections_lecturer
ON class_sections(lecturer_id);

CREATE INDEX idx_classrooms_building_active_type
ON classrooms(building_id, is_active, room_type);
