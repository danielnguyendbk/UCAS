# SKILL.md — Spring Boot Login 5 Role cho hệ thống QLPHONGHOC

## Mục tiêu
Triển khai **module đăng nhập và xác thực cho 5 role** của hệ thống `QLPHONGHOC` bằng **Spring Boot + Spring Security + JWT**, bám **đúng schema hiện có** trong `v3.sql`, không tự ý đổi tên bảng/cột chính.

Role hiện có trong bảng `users.role`:
- `ADMIN`
- `STAFF`
- `LECTURER`
- `STUDENT`
- `FACILITY`

Bảng gốc xác thực là `users`.
Bảng profile theo role:
- `lecturers` cho `LECTURER`
- `students` cho `STUDENT`
- `facility_staff` cho `FACILITY`
- `ADMIN`, `STAFF` dùng trực tiếp từ `users`

---

## Phạm vi phải làm
Chỉ làm **login/authentication + authorization nền tảng** cho backend.

Bắt buộc có:
1. Login bằng `username` + `password`
2. Password lưu/so khớp bằng `BCrypt`
3. JWT access token
4. API lấy thông tin người dùng hiện tại (`/api/auth/me`)
5. Phân quyền theo 5 role ở backend
6. Từ chối đăng nhập nếu:
   - `is_active = false`
   - `is_deleted = true`
7. Cập nhật `last_login_at` khi login thành công
8. Ghi `audit_logs` với action `LOGIN`
9. Chuẩn bị sẵn kiến trúc để các module sau dùng `@PreAuthorize` hoặc rule tương đương

Không làm trong skill này:
- refresh token
- forgot password
- OAuth2 / SSO
- frontend
- phân phòng / timetable query / request workflow

---

## Ràng buộc rất quan trọng

### 1. Bám đúng schema `v3.sql`
Dùng đúng các bảng/cột sau:

#### users
- `id`
- `username`
- `email`
- `password_hash`
- `full_name`
- `role`
- `is_active`
- `last_login_at`
- `created_at`
- `updated_at`
- `is_deleted`

#### lecturers
- `id`
- `user_id`
- `department_id`
- `staff_code`
- `full_name`
- `email`
- `phone`

#### students
- `id`
- `user_id`
- `faculty_id`
- `student_code`
- `class_name`
- `course_year`
- `phone`

#### facility_staff
- `id`
- `user_id`
- `staff_code`
- `building_id`
- `note`

#### audit_logs
- `user_id`
- `action`
- `table_name`
- `record_id`
- `old_values`
- `new_values`
- `ip_address`
- `created_at`

### 2. Không đổi tên cột `password_hash`
Entity có thể map field Java là `passwordHash`, nhưng cột DB phải giữ nguyên `password_hash`.

### 3. Không dùng self-sign-up
Hệ thống dùng **tài khoản được cấp sẵn**. Chỉ làm login với tài khoản đã có trong DB.

### 4. Role phải map đúng
Authority trong Spring Security phải theo chuẩn:
- `ROLE_ADMIN`
- `ROLE_STAFF`
- `ROLE_LECTURER`
- `ROLE_STUDENT`
- `ROLE_FACILITY`

---

## Tech stack yêu cầu
- Java 17+
- Spring Boot 3.x
- Spring Web
- Spring Security
- Spring Data JPA
- MySQL Driver
- Validation
- Lombok (nếu project đang dùng)
- `jjwt` cho JWT

Khuyến nghị dependency JWT:
- `io.jsonwebtoken:jjwt-api`
- `io.jsonwebtoken:jjwt-impl`
- `io.jsonwebtoken:jjwt-jackson`

---

## Cấu trúc package khuyến nghị
```text
com.ptit.qlphonghoc
 ├─ auth
 │   ├─ controller
 │   ├─ dto
 │   ├─ security
 │   ├─ service
 │   └─ jwt
 ├─ user
 │   ├─ entity
 │   ├─ repository
 │   ├─ enumtype
 │   └─ service
 ├─ lecturer
 │   ├─ entity
 │   └─ repository
 ├─ student
 │   ├─ entity
 │   └─ repository
 ├─ facility
 │   ├─ entity
 │   └─ repository
 ├─ audit
 │   ├─ entity
 │   ├─ repository
 │   └─ service
 ├─ common
 │   ├─ exception
 │   ├─ response
 │   └─ config
 └─ config
```

Không bắt buộc đúng 100%, nhưng phải tách rõ:
- auth/security
- user
- role profile repositories
- audit log

---

## Enum phải có

### UserRole
```java
public enum UserRole {
    ADMIN,
    STAFF,
    LECTURER,
    STUDENT,
    FACILITY
}
```

### AuditAction
```java
public enum AuditAction {
    INSERT,
    UPDATE,
    DELETE,
    LOGIN,
    APPROVE,
    REJECT,
    REQUEST,
    CANCEL
}
```

---

## Entity tối thiểu phải làm

### User
Map đúng bảng `users`.
Lưu ý:
- `role` dùng `@Enumerated(EnumType.STRING)`
- `isActive` map cột `is_active`
- `passwordHash` map cột `password_hash`
- `lastLoginAt` map `last_login_at`
- `isDeleted` map `is_deleted`

### Lecturer
Map bảng `lecturers`.
Chỉ cần đủ field phục vụ profile trả về sau login/me.

### Student
Map bảng `students`.

### FacilityStaff
Map bảng `facility_staff`.
Lưu ý: schema hiện tại không thấy ràng buộc FK `user_id -> users(id)` trong SQL, nhưng backend vẫn join theo `user_id`.
Không tự ý sửa DB trong module login này.

### AuditLog
Map bảng `audit_logs`.
`old_values` và `new_values` có thể map String hoặc JsonNode tùy cách xử lý.

---

## Repository bắt buộc

### UserRepository
Phải có các method sau:
```java
Optional<User> findByUsernameAndIsDeletedFalse(String username);
Optional<User> findByIdAndIsDeletedFalse(Integer id);
boolean existsByUsername(String username);
```

### LecturerRepository
```java
Optional<Lecturer> findByUserId(Integer userId);
```

### StudentRepository
```java
Optional<Student> findByUserId(Integer userId);
```

### FacilityStaffRepository
```java
Optional<FacilityStaff> findByUserId(Integer userId);
```

### AuditLogRepository
Repository JPA cơ bản là đủ.

---

## DTO phải có

### LoginRequest
```json
{
  "username": "sv001",
  "password": "123456"
}
```

Field:
- `username`: not blank
- `password`: not blank

### LoginResponse
Phải trả đủ các nhóm thông tin sau:
```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "username": "sv001",
    "email": "sv001@ptit.edu.vn",
    "fullName": "Nguyen Van A",
    "role": "STUDENT",
    "isActive": true
  },
  "profile": {
    "studentId": 10,
    "studentCode": "B21DCCN001",
    "className": "D21CQCN01-B",
    "facultyId": 2,
    "courseYear": 2021
  },
  "permissions": [
    "ROLE_STUDENT"
  ],
  "redirectPath": "/student"
}
```

### CurrentUserResponse
Tương tự `LoginResponse` nhưng không cần `accessToken` nếu gọi `/me`.

---

## Quy tắc profile theo role

### ADMIN
- `profile = null` hoặc object gọn
- `redirectPath = "/admin"`

### STAFF
- `profile = null` hoặc object gọn
- `redirectPath = "/staff"`

### LECTURER
Load từ `lecturers` theo `user_id`
Trả về tối thiểu:
- `lecturerId`
- `staffCode`
- `departmentId`
- `fullName`
- `email`
- `phone`
- `redirectPath = "/lecturer"`

### STUDENT
Load từ `students` theo `user_id`
Trả về tối thiểu:
- `studentId`
- `studentCode`
- `facultyId`
- `className`
- `courseYear`
- `phone`
- `redirectPath = "/student"`

### FACILITY
Load từ `facility_staff` theo `user_id`
Trả về tối thiểu:
- `facilityStaffId`
- `staffCode`
- `buildingId`
- `note`
- `redirectPath = "/facility"`

Nếu role là `LECTURER`, `STUDENT`, `FACILITY` mà không tìm thấy profile phụ tương ứng, phải coi là dữ liệu không nhất quán và trả lỗi server có message rõ ràng.

---

## API phải làm

### 1. POST `/api/auth/login`
Mục đích: đăng nhập bằng username/password.

#### Luồng xử lý chuẩn
1. Tìm `users` theo `username` và `is_deleted = false`
2. Nếu không có -> trả `401 Unauthorized`
3. Nếu `is_active = false` -> trả `403 Forbidden`
4. So khớp password bằng `PasswordEncoder.matches(raw, passwordHash)`
5. Nếu sai mật khẩu -> trả `401 Unauthorized`
6. Nếu đúng:
   - cập nhật `last_login_at`
   - sinh JWT
   - load profile phụ theo role nếu cần
   - ghi audit log action = `LOGIN`
   - trả `LoginResponse`

#### Response code
- `200 OK`: login thành công
- `401 Unauthorized`: sai username/password
- `403 Forbidden`: tài khoản bị vô hiệu hóa

#### Không được làm
- không trả `passwordHash`
- không phân biệt quá chi tiết giữa “sai username” và “sai password” trong response message cho client

---

### 2. GET `/api/auth/me`
Mục đích: lấy thông tin user hiện tại từ JWT.

#### Luồng xử lý
1. Đọc token từ header `Authorization: Bearer <token>`
2. Validate token
3. Lấy username từ token
4. Load user từ DB
5. Load profile phụ theo role nếu cần
6. Trả `CurrentUserResponse`

#### Response code
- `200 OK`: token hợp lệ
- `401 Unauthorized`: token thiếu/sai/hết hạn

---

### 3. POST `/api/auth/logout` *(optional stub)*
Nếu làm, chỉ cần trả thành công phía client-side do đang dùng access token stateless.
Nếu chưa có blacklist token thì ghi rõ trong code comment và README.

---

## JWT yêu cầu

### Claims bắt buộc
JWT phải chứa tối thiểu:
- `sub` = username
- `userId`
- `role`

Ví dụ logic:
```java
claims.put("userId", user.getId());
claims.put("role", user.getRole().name());
```

### Config trong `application.properties` hoặc `application.yml`
Ví dụ:
```properties
app.jwt.secret=your-very-long-base64-secret
app.jwt.expiration=86400000
```

### Yêu cầu validate
- token hết hạn phải bị từ chối
- token sai chữ ký phải bị từ chối
- token không hợp lệ phải bị từ chối

---

## Security config yêu cầu
Dùng `SecurityFilterChain`, không dùng cách cũ đã deprecated.

### Endpoint public
```text
POST /api/auth/login
```

### Endpoint authenticated
```text
GET /api/auth/me
```

### Mở sẵn rule role-based cho tương lai
Ví dụ:
- `/api/admin/**` -> `hasRole("ADMIN")`
- `/api/staff/**` -> `hasAnyRole("STAFF", "ADMIN")`
- `/api/lecturer/**` -> `hasRole("LECTURER")`
- `/api/student/**` -> `hasRole("STUDENT")`
- `/api/facility/**` -> `hasRole("FACILITY")`

### Bắt buộc
- disable session state nếu dùng JWT stateless
- cấu hình `SessionCreationPolicy.STATELESS`
- thêm JWT filter trước `UsernamePasswordAuthenticationFilter`
- password encoder = BCryptPasswordEncoder

---

## Class bắt buộc nên có

### CustomUserDetails
Phải bọc `User` và cung cấp:
- `getUsername()`
- `getPassword()` trả `passwordHash`
- `getAuthorities()` trả danh sách 1 role theo chuẩn `ROLE_*`
- `isEnabled()` trả theo `isActive && !isDeleted`
- giữ thêm các field tiện dùng như `userId`, `role`

### CustomUserDetailsService
Load user theo `username` từ `users`.
Nếu không có -> `UsernameNotFoundException`.
Nếu `isDeleted = true` -> coi như không hợp lệ.

### JwtService
Phải có:
- `generateToken(CustomUserDetails userDetails)`
- `extractUsername(String token)`
- `isTokenValid(String token, UserDetails userDetails)`
- helper lấy signing key

### JwtAuthenticationFilter
- đọc header `Authorization`
- validate JWT
- set `SecurityContext`

### AuthService
Phải chứa logic chính của login/me.
Không nhét hết logic vào controller.

### AuthController
Chỉ điều phối request/response.

### AuditLogService
Có method tối thiểu:
```java
void logLogin(Integer userId, String ipAddress);
```

---

## Gợi ý thiết kế response thống nhất
Dùng format kiểu:
```json
{
  "success": true,
  "message": "Login successful",
  "data": { ... }
}
```

Lỗi:
```json
{
  "success": false,
  "message": "Invalid username or password",
  "errors": null,
  "timestamp": "2026-04-17T14:30:00"
}
```

Không bắt buộc đúng 100%, nhưng toàn project nên thống nhất một format.

---

## Rule phân quyền phải chuẩn bị ngay từ đầu
Cursor phải code sẵn nền tảng để các module sau có thể dùng dễ dàng.

### Quy ước quyền tối thiểu
- `ADMIN`: toàn quyền quản trị
- `STAFF`: quản lý học phần, lịch gốc, phân phòng, booking nghiệp vụ
- `LECTURER`: xem lịch dạy của chính mình, gửi request liên quan phòng học
- `STUDENT`: xem lịch học của chính mình
- `FACILITY`: xem lịch phòng để phục vụ mở cửa/chuẩn bị phòng

### Bắt buộc lưu ý
Role chỉ là lớp đầu tiên.
Về sau khi làm timetable/query phải kiểm tra thêm phạm vi dữ liệu:
- student chỉ xem dữ liệu của chính student đó
- lecturer chỉ xem dữ liệu của chính lecturer đó
- facility có thể giới hạn theo `building_id`

Module login hiện tại chỉ cần chuẩn bị foundation, chưa cần code full business scope check.

---

## Mapping role -> redirectPath
Hard-code tạm trong backend response để frontend dùng ngay:
```text
ADMIN     -> /admin
STAFF     -> /staff
LECTURER  -> /lecturer
STUDENT   -> /student
FACILITY  -> /facility
```

Nếu frontend sau này đổi route thì chỉ sửa mapping ở một chỗ.

---

## Error handling bắt buộc
Phải có `GlobalExceptionHandler` hoặc tương đương để xử lý:
- validation error
- bad credentials
- disabled account
- access denied
- token expired / malformed
- internal server error

### Message gợi ý
- `Invalid username or password`
- `Account is inactive`
- `Unauthorized`
- `Access denied`
- `User profile data is inconsistent`

---

## Audit log cho login
Khi login thành công, insert vào `audit_logs`:
- `user_id` = id user
- `action` = `LOGIN`
- `table_name` = `users`
- `record_id` = id user
- `new_values` có thể lưu JSON đơn giản, ví dụ thời điểm login hoặc role
- `ip_address` lấy từ request

Không bắt buộc log login thất bại vào DB trong phiên bản đầu, nhưng nên comment TODO nếu muốn mở rộng sau.

---

## Seed data gợi ý để test nhanh
Tạo sẵn 5 user test với BCrypt password chung, ví dụ `123456`:
- `admin01` / role `ADMIN`
- `staff01` / role `STAFF`
- `lect01` / role `LECTURER`
- `sv001` / role `STUDENT`
- `fac01` / role `FACILITY`

Với `LECTURER`, `STUDENT`, `FACILITY` phải có bản ghi profile tương ứng.

Có thể seed bằng `CommandLineRunner` nếu project chưa có dữ liệu.

---

## Acceptance criteria bắt buộc
Cursor chỉ được coi là xong khi thỏa tất cả điều kiện sau:

1. Login đúng với 5 role đều nhận token thành công
2. Login sai password trả `401`
3. User `is_active = false` trả `403`
4. User `is_deleted = true` không đăng nhập được
5. `/api/auth/me` trả đúng role hiện tại
6. `LECTURER` login trả đúng profile lecturer
7. `STUDENT` login trả đúng profile student
8. `FACILITY` login trả đúng profile facility staff
9. `last_login_at` được update sau login thành công
10. Có insert log `LOGIN` vào `audit_logs`
11. Endpoint private không truy cập được nếu thiếu token
12. Endpoint sai role bị chặn đúng

---

## Test cases tối thiểu cần viết
Nếu project có test, ưu tiên viết:

### Unit test
- `JwtServiceTest`
- `AuthServiceTest`
- `CustomUserDetailsServiceTest`

### Integration test / MockMvc
- login success cho 5 role
- login fail sai password
- login fail inactive user
- `/api/auth/me` success
- `/api/auth/me` fail khi không có token

---

## Phong cách code bắt buộc
- clean code, tách layer rõ
- controller mỏng
- business logic nằm ở service
- repository không chứa business logic phức tạp
- dùng DTO cho request/response, không trả thẳng entity
- không hard-code password thô trong code chính thức ngoài seed/test
- comment ngắn gọn, không lan man

---

## Gợi ý trình tự implement cho Cursor
1. Tạo enum `UserRole`, `AuditAction`
2. Tạo entity `User`, `Lecturer`, `Student`, `FacilityStaff`, `AuditLog`
3. Tạo repository
4. Tạo `CustomUserDetails` + `CustomUserDetailsService`
5. Tạo `JwtService`
6. Tạo `JwtAuthenticationFilter`
7. Tạo `SecurityConfig`
8. Tạo DTO `LoginRequest`, `LoginResponse`, `CurrentUserResponse`
9. Tạo `AuditLogService`
10. Tạo `AuthService`
11. Tạo `AuthController`
12. Tạo `GlobalExceptionHandler`
13. Viết seed/test user
14. Test thủ công bằng Postman/HTTP client

---

## Definition of done
Module được coi là hoàn tất khi:
- build chạy không lỗi
- login 5 role hoạt động
- me endpoint hoạt động
- token validate đúng
- inactive/deleted account bị chặn
- audit log login có ghi
- code sạch, dễ mở rộng cho các module sau

---

## Lệnh làm việc cho Cursor
Hãy triển khai module theo đúng yêu cầu ở trên, **ưu tiên code chạy được trước**, không tự ý mở rộng ngoài phạm vi. Nếu gặp chỗ schema chưa hoàn hảo, hãy:
1. giữ nguyên behavior bám DB hiện có,
2. comment rõ chỗ cần cải tiến,
3. không phá vỡ module login.

Nếu cần tạo file mới, ưu tiên tạo đầy đủ:
- entity
- enum
- repository
- DTO
- security config
- jwt service/filter
- auth service/controller
- exception handler
- seed data test

Sau khi code xong, in ra danh sách file đã tạo/sửa và nêu rõ cách test 5 role bằng request mẫu.
