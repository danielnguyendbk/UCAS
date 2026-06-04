# qlphonghoc Spring Boot Backend

Backend Spring Boot đã được chỉnh theo database MySQL `QLPHONGHOC1` từ file `databse_final.sql`.

## Chạy local

1. Import `databse_final.sql` vào MySQL Workbench.
2. Mở `src/main/resources/application.properties` và sửa mật khẩu MySQL:

```properties
spring.datasource.password=YOUR_DB_PASSWORD
```

3. Chạy backend:

```bash
mvn spring-boot:run
```

Backend chạy tại `http://localhost:8080`.

## Endpoint chính

Các endpoint cũ vẫn giữ: `/academic-years`, `/semesters`, `/faculties`, `/departments`, `/courses`, `/lecturers`, `/buildings`, `/classrooms`, `/time-slots`.

Đã bổ sung CRUD cơ bản cho các bảng mới: `/users`, `/students`, `/facility-staff`, `/clubs`, `/club-memberships`, `/class-sections`, `/schedules`, `/student-section-enrollments`, `/temporary-room-changes`, `/room-borrow-requests`, `/classroom-issue-reports`, `/audit-logs`, `/semester-weeks`, `/class-sessions`, `/academic-calendar-blocks`, `/exams`, `/exam-invigilators`.

Mỗi endpoint cũng hỗ trợ dạng `/api/...` để dễ nối frontend nếu cần.
