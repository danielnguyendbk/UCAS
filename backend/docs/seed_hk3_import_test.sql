-- =========================================================
-- UCAS / QLPHONGHOC - HK3 IMPORT TEST SEED
-- Purpose:
--   1. Create HK3-2025-2026.
--   2. Create test courses that start as is_active = 0.
--   3. Create sample students only to make class_name valid for timetable import.
--   4. Do NOT create class_sections here.
--
-- After running this file:
--   Import docs/import-samples/HK3_ucas_timetable_import_test.xlsx
--   Expected result:
--     HK3INT201, HK3INT202, HK3SEC201 become is_active = 1 after import.
--     HK3INT203 remains is_active = 0 because it is not in the Excel file.
-- =========================================================

USE QLPHONGHOC;

SET NAMES utf8mb4;
SET SQL_SAFE_UPDATES = 0;

-- =========================================================
-- 1. Required departments
-- =========================================================

INSERT INTO departments (
    department_code,
    department_name,
    is_deleted
)
SELECT
    'CNTT',
    'Công nghệ thông tin',
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM departments
    WHERE department_code = 'CNTT'
);

INSERT INTO departments (
    department_code,
    department_name,
    is_deleted
)
SELECT
    'ATTT',
    'An toàn thông tin',
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM departments
    WHERE department_code = 'ATTT'
);

-- =========================================================
-- 2. Academic year 2025-2026
-- =========================================================

INSERT INTO academic_years (
    year_label,
    start_date,
    end_date,
    is_current,
    is_deleted
)
VALUES (
    '2025-2026',
    '2025-08-10',
    '2026-08-09',
    1,
    0
)
ON DUPLICATE KEY UPDATE
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    is_current = VALUES(is_current),
    is_deleted = 0;

SET @academic_year_id := (
    SELECT academic_year_id
    FROM academic_years
    WHERE year_label = '2025-2026'
    LIMIT 1
);

-- =========================================================
-- 3. HK3 semester
-- =========================================================

INSERT INTO semesters (
    academic_year_id,
    semester_code,
    semester_year,
    semester_type,
    semester_name,
    timetable_status,
    exam_workflow_status,
    start_date,
    end_date,
    status,
    is_deleted
)
VALUES (
    @academic_year_id,
    'HK3-2025-2026',
    '2025-2026',
    'SUMMER',
    'Học kỳ 3 năm học 2025-2026',
    'DRAFT',
    'DRAFT',
    '2026-06-15',
    '2026-08-09',
    'UPCOMING',
    0
)
ON DUPLICATE KEY UPDATE
    academic_year_id = VALUES(academic_year_id),
    semester_year = VALUES(semester_year),
    semester_type = VALUES(semester_type),
    semester_name = VALUES(semester_name),
    timetable_status = VALUES(timetable_status),
    exam_workflow_status = VALUES(exam_workflow_status),
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    status = VALUES(status),
    is_deleted = 0;

SET @hk3_id := (
    SELECT semester_id
    FROM semesters
    WHERE semester_code = 'HK3-2025-2026'
    LIMIT 1
);

-- =========================================================
-- 4. HK3 weeks: week 45-52
-- =========================================================

INSERT INTO semester_weeks (
    semester_id,
    week_no,
    start_date,
    end_date,
    is_break,
    note
)
SELECT
    @hk3_id,
    x.week_no,
    DATE_ADD('2026-06-15', INTERVAL (x.week_no - 45) * 7 DAY),
    DATE_ADD('2026-06-15', INTERVAL (x.week_no - 45) * 7 + 6 DAY),
    0,
    CONCAT('HK3 - Tuần ', x.week_no)
FROM (
    SELECT 45 AS week_no UNION ALL
    SELECT 46 UNION ALL
    SELECT 47 UNION ALL
    SELECT 48 UNION ALL
    SELECT 49 UNION ALL
    SELECT 50 UNION ALL
    SELECT 51 UNION ALL
    SELECT 52
) x
ON DUPLICATE KEY UPDATE
    start_date = VALUES(start_date),
    end_date = VALUES(end_date),
    is_break = 0,
    note = VALUES(note);

-- =========================================================
-- 5. HK3 test courses
-- These courses start inactive.
-- Timetable import will create class_sections and trigger will activate used courses.
-- =========================================================

INSERT INTO courses (
    department_id,
    course_code,
    course_name,
    credits,
    course_type,
    required_room_type,
    is_active,
    description,
    is_deleted
)
VALUES
    (
        (SELECT department_id FROM departments WHERE department_code = 'CNTT' LIMIT 1),
        'HK3INT201',
        'HK3 - Lập trình Web nâng cao',
        3,
        'MAJOR',
        'LAB',
        0,
        'Môn test HK3 - ban đầu chưa sử dụng',
        0
    ),
    (
        (SELECT department_id FROM departments WHERE department_code = 'CNTT' LIMIT 1),
        'HK3INT202',
        'HK3 - Kiểm thử phần mềm',
        3,
        'MAJOR',
        'LECTURE',
        0,
        'Môn test HK3 - ban đầu chưa sử dụng',
        0
    ),
    (
        (SELECT department_id FROM departments WHERE department_code = 'ATTT' LIMIT 1),
        'HK3SEC201',
        'HK3 - An toàn ứng dụng Web',
        3,
        'MAJOR',
        'LAB',
        0,
        'Môn test HK3 - ban đầu chưa sử dụng',
        0
    ),
    (
        (SELECT department_id FROM departments WHERE department_code = 'CNTT' LIMIT 1),
        'HK3INT203',
        'HK3 - Điện toán đám mây',
        3,
        'MAJOR',
        'LECTURE',
        0,
        'Môn test HK3 - không nằm trong file import, dùng để kiểm tra vẫn chưa sử dụng',
        0
    )
ON DUPLICATE KEY UPDATE
    department_id = VALUES(department_id),
    course_name = VALUES(course_name),
    credits = VALUES(credits),
    course_type = VALUES(course_type),
    required_room_type = VALUES(required_room_type),
    description = VALUES(description),
    is_deleted = 0;

-- =========================================================
-- 6. Sample users for HK3 administrative classes
-- Only required because current timetable import validates class_name through students.
-- Do not use full_name or is_active here because different schema versions may not have those columns.
-- =========================================================

INSERT INTO users (
    username,
    email,
    password_hash,
    role
)
VALUES
    (
        'hk3_sv_cn_01',
        'hk3_sv_cn_01@ptit.edu.vn',
        '$2y$10$uHGFNnab1YGyabYST4koFeYE7UjoPj1YYb.TMbAXMUVAhH6bvUGCK',
        'STUDENT'
    ),
    (
        'hk3_sv_cn_02',
        'hk3_sv_cn_02@ptit.edu.vn',
        '$2y$10$uHGFNnab1YGyabYST4koFeYE7UjoPj1YYb.TMbAXMUVAhH6bvUGCK',
        'STUDENT'
    ),
    (
        'hk3_sv_at_01',
        'hk3_sv_at_01@ptit.edu.vn',
        '$2y$10$uHGFNnab1YGyabYST4koFeYE7UjoPj1YYb.TMbAXMUVAhH6bvUGCK',
        'STUDENT'
    )
ON DUPLICATE KEY UPDATE
    email = VALUES(email),
    password_hash = VALUES(password_hash),
    role = 'STUDENT';

-- Detect real users primary key column: user_id or id.
SET @user_pk_col := (
    SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'user_id'
        ) THEN 'user_id'
        WHEN EXISTS (
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'id'
        ) THEN 'id'
        ELSE NULL
    END
);

SET @insert_students_sql := CONCAT(
'INSERT INTO students (
    user_id,
    department_id,
    student_code,
    class_name,
    course_year,
    phone,
    is_deleted
)
VALUES
    (
        (SELECT ', @user_pk_col, ' FROM users WHERE username = ''hk3_sv_cn_01'' LIMIT 1),
        (SELECT department_id FROM departments WHERE department_code = ''CNTT'' LIMIT 1),
        ''HK3SV-CN-01'',
        ''D23CN-HK3-01'',
        2023,
        ''0903000001'',
        0
    ),
    (
        (SELECT ', @user_pk_col, ' FROM users WHERE username = ''hk3_sv_cn_02'' LIMIT 1),
        (SELECT department_id FROM departments WHERE department_code = ''CNTT'' LIMIT 1),
        ''HK3SV-CN-02'',
        ''D23CN-HK3-02'',
        2023,
        ''0903000002'',
        0
    ),
    (
        (SELECT ', @user_pk_col, ' FROM users WHERE username = ''hk3_sv_at_01'' LIMIT 1),
        (SELECT department_id FROM departments WHERE department_code = ''ATTT'' LIMIT 1),
        ''HK3SV-AT-01'',
        ''D23AT-HK3-01'',
        2023,
        ''0903000003'',
        0
    )
ON DUPLICATE KEY UPDATE
    department_id = VALUES(department_id),
    class_name = VALUES(class_name),
    course_year = VALUES(course_year),
    phone = VALUES(phone),
    is_deleted = 0'
);

PREPARE stmt FROM @insert_students_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =========================================================
-- 7. Sync HK3 course active status based on existing class_sections.
-- Before importing the Excel test file, these should remain inactive.
-- After importing, rerunning this file keeps already-used courses active.
-- =========================================================

UPDATE courses c
SET c.is_active = EXISTS (
    SELECT 1
    FROM class_sections cs
    WHERE cs.course_id = c.course_id
      AND COALESCE(cs.status, 'ACTIVE') NOT IN ('CANCELLED', 'COMPLETED')
)
WHERE c.course_code IN ('HK3INT201', 'HK3INT202', 'HK3SEC201', 'HK3INT203');

SET SQL_SAFE_UPDATES = 1;

-- =========================================================
-- Verification queries
-- =========================================================

SELECT 
    semester_id,
    semester_code,
    semester_name,
    status
FROM semesters
WHERE semester_code = 'HK3-2025-2026';

SELECT 
    c.course_code,
    c.course_name,
    d.department_code,
    c.is_active,
    COUNT(cs.section_id) AS total_class_sections
FROM courses c
JOIN departments d ON d.department_id = c.department_id
LEFT JOIN class_sections cs ON cs.course_id = c.course_id
WHERE c.course_code IN ('HK3INT201', 'HK3INT202', 'HK3SEC201', 'HK3INT203')
GROUP BY 
    c.course_code,
    c.course_name,
    d.department_code,
    c.is_active
ORDER BY c.course_code;

SELECT 
    class_name,
    COUNT(*) AS total_students
FROM students
WHERE class_name IN ('D23CN-HK3-01', 'D23CN-HK3-02', 'D23AT-HK3-01')
  AND is_deleted = 0
GROUP BY class_name;