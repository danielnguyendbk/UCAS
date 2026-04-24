# Hướng Dẫn Mentor Về Module Login/Auth

## Tổng Quan Module

### Module này chịu trách nhiệm gì

Module auth/login của backend này là cổng vào của hệ thống. Nhiệm vụ chính của nó là:

- nhận `username` và `password` từ client
- kiểm tra tài khoản có tồn tại và có được phép đăng nhập hay không
- sinh JWT access token
- trả về thông tin user hiện tại, role, và profile theo role
- bảo vệ các API private bằng Spring Security
- ghi log đăng nhập thành công vào bảng `audit_logs`

Module này đang được thiết kế khá tập trung, chỉ xử lý phần nền tảng của xác thực và phân quyền. Nó chưa xử lý:

- đăng ký tài khoản
- quên mật khẩu
- refresh token
- logout blacklist
- SSO / OAuth2

Điểm rất quan trọng là hệ thống này dùng mô hình tài khoản được cấp sẵn trong database, không phải người dùng tự đăng ký.

### Vì sao hệ thống tài khoản cấp sẵn cần cấu trúc này

Đây là hệ thống quản lý/phân phòng học trong môi trường trường học. Các đối tượng như:

- admin
- staff
- lecturer
- student
- facility staff

thường đã tồn tại sẵn trong dữ liệu nghiệp vụ của tổ chức. Vì vậy hệ thống không cần chức năng sign-up công khai.

Cách tổ chức dữ liệu trong project phản ánh đúng điều đó:

- bảng `users` là bảng gốc cho xác thực
- bảng `lecturers`, `students`, `facility_staff` là bảng profile theo role

Nói ngắn gọn:

- `users` trả lời câu hỏi: "ai có thể đăng nhập?"
- bảng profile trả lời câu hỏi: "người đó là ai trong nghiệp vụ?"

### Vai trò của 5 role trong project

Role được lưu trong cột `users.role`, gồm:

- `ADMIN`
- `STAFF`
- `LECTURER`
- `STUDENT`
- `FACILITY`

Ở mức auth, role ảnh hưởng đến:

- authority đưa vào Spring Security
- nhóm endpoint user được phép truy cập
- profile nào cần load thêm sau khi login
- `redirectPath` backend trả về cho frontend

Role không thay thế hoàn toàn việc kiểm tra phạm vi dữ liệu. Ví dụ:

- lecturer có thể được vào `/api/lecturer/**`
- nhưng sau này backend vẫn phải kiểm tra lecturer chỉ xem dữ liệu của chính mình

---

## Kiến Trúc Auth Trong Project Này

Phần này giải thích các file quan trọng của module auth dựa trên code thật trong project.

### Điểm khởi động ứng dụng

#### `src/main/java/com/ptit/qlphonghoc/QlphonghocApplication.java`

Đây là class main của Spring Boot.

Nó làm gì:

- khởi động Spring application context
- scan bean, entity, config, controller, service, repository
- bật toàn bộ ứng dụng lên

Vì sao nó tồn tại:

- mọi ứng dụng Spring Boot đều cần một class main để boot app

Khi nào nó được gọi:

- khi chạy `mvn spring-boot:run`
- hoặc chạy app từ IntelliJ

Nó tương tác với auth thế nào:

- không gọi trực tiếp logic auth
- nhưng nó là nơi khởi tạo container để toàn bộ bean auth hoạt động

### Tầng controller

#### `auth/controller/AuthController.java`

Đây là điểm vào HTTP của module auth.

Nó làm gì:

- cung cấp `POST /api/auth/login`
- cung cấp `GET /api/auth/me`
- nhận request HTTP và chuyển xuống service
- bọc response thành `ApiResponse`

Vì sao nó tồn tại:

- controller nên chỉ xử lý request/response
- không nên nhét business logic phức tạp vào đây

Khi nào nó được gọi:

- khi client gọi `/api/auth/login`
- khi client gọi `/api/auth/me`

Nó tương tác với file khác ra sao:

- gọi `AuthService.login(...)`
- gọi `AuthService.getCurrentUser(...)`
- nhận `CustomUserDetails` từ Spring Security qua `@AuthenticationPrincipal`

Nhận xét theo góc nhìn mentor:

Controller này đang mỏng, đó là thiết kế tốt. Nếu kiểm tra password, sinh JWT, load profile đều viết trong controller thì class sẽ rất khó test và khó bảo trì.

### Tầng service

#### `auth/service/AuthService.java`

Đây là trung tâm của module auth hiện tại.

Nó làm gì:

- kiểm tra user theo username
- chặn tài khoản inactive
- so khớp mật khẩu bằng BCrypt
- cập nhật `last_login_at`
- sinh JWT
- load profile theo role
- ghi audit log login
- trả về DTO cho login và `/me`

Vì sao nó tồn tại:

- business logic nên nằm ở service layer
- login không chỉ là "đúng username/password", mà còn có cập nhật thời gian login, audit log, và dựng response

Khi nào nó được gọi:

- từ `AuthController`

Nó tương tác với file khác ra sao:

- dùng `UserRepository` để tìm `User`
- dùng `LecturerRepository`, `StudentRepository`, `FacilityStaffRepository` để tìm profile theo role
- dùng `PasswordEncoder` để so password hash
- dùng `JwtService` để sinh token
- dùng `AuditLogService` để ghi log
- ném exception để `GlobalExceptionHandler` xử lý

Điểm kiến trúc đáng chú ý:

Project này không dùng `AuthenticationManager` cho API login. Thay vào đó, `AuthService.login()` tự kiểm tra password bằng:

```java
passwordEncoder.matches(request.password(), user.getPasswordHash())
```

Đây là cách làm đơn giản, hợp lý cho một module học tập hoặc nền tảng ban đầu. Trong hệ thống lớn hơn, nhiều team sẽ đẩy việc xác thực credential vào pipeline chuẩn của Spring Security.

### Nhóm file JWT

#### `auth/jwt/JwtProperties.java`

Nó làm gì:

- map config từ `application.yml` với prefix `app.jwt`

Vì sao nó tồn tại:

- tách secret và expiration khỏi code
- giúp cấu hình linh hoạt hơn

Khi nào được gọi:

- lúc Spring bind cấu hình khi app khởi động

Tương tác với file khác:

- `JwtService` đọc `secret` và `expiration`
- `SecurityConfig` bật property binding cho class này

#### `auth/jwt/JwtService.java`

Nó làm gì:

- sinh JWT token
- lấy username từ token
- validate token
- dựng signing key từ chuỗi secret Base64

Vì sao nó tồn tại:

- gom logic JWT vào một nơi
- tránh để controller/service phải thao tác trực tiếp với thư viện JWT

Khi nào được gọi:

- lúc login thành công để sinh token
- lúc request private đi qua filter để parse và validate token

Tương tác với file khác:

- nhận `CustomUserDetails`
- được gọi bởi `AuthService`
- được gọi bởi `JwtAuthenticationFilter`

Các claim hiện tại của token:

- `sub` = username
- `userId`
- `role`

Nhận xét:

Project này không tin token một cách tuyệt đối. Mỗi request private vẫn load lại user từ database qua `CustomUserDetailsService`. Đây là điểm tốt vì nếu user bị khóa sau khi token đã phát ra, backend vẫn có thể chặn.

### Nhóm file security

#### `config/SecurityConfig.java`

Đây là file cấu hình bảo mật trung tâm.

Nó làm gì:

- định nghĩa `SecurityFilterChain`
- cấu hình ứng dụng chạy stateless
- tắt CSRF và HTTP Basic
- khai báo route nào public, route nào cần auth, route nào cần role
- đăng ký `JwtAuthenticationFilter`
- tạo `PasswordEncoder`
- custom response cho 401 và 403

Vì sao nó tồn tại:

- tất cả luật bảo mật tập trung ở một nơi

Khi nào được gọi:

- khi app startup

Tương tác với file khác:

- inject `JwtAuthenticationFilter`
- cung cấp bean `PasswordEncoder` cho `AuthService` và `SeedDataConfig`
- dùng `ErrorResponse` để trả JSON lỗi bảo mật

#### `auth/security/CustomUserDetails.java`

Đây là adapter giữa entity `User` và Spring Security.

Nó làm gì:

- bọc `User` thành `UserDetails`
- cung cấp username, password hash, authorities, trạng thái enabled

Vì sao nó tồn tại:

- Spring Security làm việc với `UserDetails`
- entity thuần JPA chưa đủ để Spring Security hiểu trực tiếp

Khi nào được gọi:

- khi filter cần dựng user đăng nhập hiện tại
- khi token được sinh sau login

Tương tác với file khác:

- bọc `User`
- cấp authority dạng `ROLE_*`
- dùng trong `JwtService`

#### `auth/security/CustomUserDetailsService.java`

Đây là service load user cho Spring Security.

Nó làm gì:

- tìm user theo username
- bỏ qua user có `is_deleted = true`
- trả về `CustomUserDetails`

Vì sao nó tồn tại:

- đây là cầu nối giữa Spring Security và bảng `users`

Khi nào được gọi:

- chủ yếu trong `JwtAuthenticationFilter`

Tương tác với file khác:

- gọi `UserRepository`
- trả về `CustomUserDetails`

Điểm cần hiểu rõ:

Nó không được dùng trực tiếp trong API login hiện tại. Login đi qua `AuthService` chứ không qua `AuthenticationManager`.

#### `auth/security/JwtAuthenticationFilter.java`

Đây là filter rất quan trọng của hệ thống.

Nó làm gì:

- chạy mỗi request một lần
- đọc header `Authorization`
- kiểm tra có `Bearer <token>` không
- parse JWT
- lấy username từ token
- load user từ DB
- validate token
- nếu hợp lệ thì đưa authentication vào `SecurityContextHolder`

Vì sao nó tồn tại:

- vì app đang chạy stateless bằng JWT
- backend phải tự dựng lại thông tin user trên mỗi request private

Khi nào được gọi:

- với mọi request đi qua Spring Security filter chain

Tương tác với file khác:

- dùng `JwtService`
- dùng `CustomUserDetailsService`
- tạo `UsernamePasswordAuthenticationToken`

Điểm quan trọng:

Nếu request không có token, filter không tự trả lỗi. Nó chỉ cho request đi tiếp. Sau đó:

- nếu endpoint public thì vẫn chạy bình thường
- nếu endpoint private thì Spring Security sẽ chặn ở bước authorization

---

## Luồng Login End-to-End

Phần này giải thích rất cụ thể từ lúc user nhập tài khoản đến lúc backend trả token.

### Luồng đầy đủ của `POST /api/auth/login`

1. User nhập `username` và `password` ở frontend hoặc Postman.

   Ví dụ request:

   ```json
   {
     "username": "admin01",
     "password": "123456"
   }
   ```

2. Request đi vào `AuthController.login(...)`.

   Method hiện tại:

   ```java
   public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                           HttpServletRequest httpRequest)
   ```

   Ý nghĩa:

- `@RequestBody`: map JSON thành object Java
- `@Valid`: bật validation cho request DTO
- `HttpServletRequest`: lấy IP phục vụ audit log

3. Spring validate `LoginRequest`.

   File `LoginRequest.java` dùng:

   ```java
   @NotBlank(message = "Username is required")
   @NotBlank(message = "Password is required")
   ```

   Nếu thiếu dữ liệu, Spring ném `MethodArgumentNotValidException`, sau đó `GlobalExceptionHandler` trả về `400 Bad Request`.

4. `AuthController` gọi:

   ```java
   authService.login(request, httpRequest)
   ```

5. Trong `AuthService.login(...)`, backend tìm user:

   ```java
   userRepository.findByUsernameAndIsDeletedFalse(request.username())
   ```

   Ý nghĩa nghiệp vụ:

- chỉ user chưa bị soft delete mới được phép đi tiếp
- nếu không tìm thấy user, backend trả như sai tài khoản/mật khẩu, không tiết lộ username có tồn tại hay không

6. Nếu không có user phù hợp, service ném:

   ```java
   new BadCredentialsException("Invalid username or password")
   ```

   Sau đó `GlobalExceptionHandler` trả về `401 Unauthorized`.

7. Nếu tìm thấy user, service kiểm tra `is_active`.

   ```java
   if (!user.isActive()) {
       throw new InactiveAccountException("Account is inactive");
   }
   ```

   Ý nghĩa:

- user tồn tại nhưng đang bị vô hiệu hóa
- đây không phải lỗi sai mật khẩu

8. Service kiểm tra password:

   ```java
   if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
       throw new BadCredentialsException("Invalid username or password");
   }
   ```

   Đây là bước cực kỳ quan trọng:

- password người dùng nhập là raw password
- DB lưu `password_hash`
- `BCryptPasswordEncoder.matches(...)` sẽ hash raw password rồi so khớp theo chuẩn BCrypt

9. Nếu password đúng, service cập nhật thời gian login:

   ```java
   user.setLastLoginAt(LocalDateTime.now());
   userRepository.save(user);
   ```

10. Service tạo `CustomUserDetails` từ `User`:

   ```java
   CustomUserDetails userDetails = new CustomUserDetails(user);
   ```

11. Service gọi `JwtService.generateToken(userDetails)` để sinh JWT.

12. `JwtService` nhét các dữ liệu sau vào token:

- subject = username
- claim `userId`
- claim `role`
- issuedAt
- expiration

13. Sau khi có token, service resolve profile theo role bằng:

   ```java
   Object profile = resolveProfile(user);
   ```

14. Bên trong `resolveProfile(user)`:

- `ADMIN` và `STAFF` trả `null`
- `LECTURER` gọi `mapLecturerProfile(user.getId())`
- `STUDENT` gọi `mapStudentProfile(user.getId())`
- `FACILITY` gọi `mapFacilityProfile(user.getId())`

15. Nếu role là `LECTURER`, `STUDENT`, `FACILITY` mà không có profile tương ứng, backend ném:

   ```java
   UserProfileInconsistentException("User profile data is inconsistent")
   ```

   Ý nghĩa:

- dữ liệu auth đúng
- nhưng dữ liệu nghiệp vụ bị lệch
- đây là lỗi rất hay gặp trong hệ thống dùng tài khoản cấp sẵn

16. Service ghi audit log:

   ```java
   auditLogService.logLogin(user, extractClientIp(httpRequest));
   ```

17. `AuditLogService` tạo một bản ghi `audit_logs` với:

- `user_id`
- `action = LOGIN`
- `table_name = users`
- `record_id = user.id`
- `ip_address`
- `new_values` chứa username, role, loginAt

18. Service dựng `LoginResponse`, gồm:

- `accessToken`
- `tokenType`
- `expiresIn`
- `user`
- `profile`
- `permissions`
- `redirectPath`

19. `AuthController` bọc response bằng:

   ```java
   ApiResponse.success("Login successful", ...)
   ```

20. Client nhận HTTP 200 và lấy token để gọi các API private tiếp theo.

### Luồng của `GET /api/auth/me`

Đây là API dùng để lấy thông tin user hiện tại dựa trên token.

1. Client gửi request kèm header:

   ```text
   Authorization: Bearer <jwt>
   ```

2. Request đi vào Spring Security filter chain.

3. `JwtAuthenticationFilter` đọc `Authorization`.

4. Nếu header đúng format `Bearer ...`, filter tách token ra.

5. Filter gọi:

   ```java
   jwtService.extractUsername(jwt)
   ```

   để lấy `sub` từ token.

6. Filter gọi:

   ```java
   userDetailsService.loadUserByUsername(username)
   ```

   để load user từ DB.

7. Filter kiểm tra:

   ```java
   userDetails.isEnabled() && jwtService.isTokenValid(jwt, userDetails)
   ```

8. Nếu hợp lệ, filter tạo `UsernamePasswordAuthenticationToken` và set vào `SecurityContextHolder`.

9. Request tới `AuthController.me(...)`.

10. Spring tự inject principal hiện tại vào:

   ```java
   @AuthenticationPrincipal CustomUserDetails userDetails
   ```

11. Controller gọi:

   ```java
   authService.getCurrentUser(userDetails.getUsername())
   ```

12. Service load lại `User`, kiểm tra `is_active`, resolve profile, dựng `CurrentUserResponse`.

13. Backend trả thông tin user hiện tại cho client.

Tại sao `/me` quan trọng:

- frontend không nên tự tin vào dữ liệu lưu local
- `/me` là nguồn sự thật chính thức từ backend
- frontend có thể dùng nó để dựng menu, role, profile, và route

---

## Luồng Spring Security Trong Project Này

Đây là phần nhiều bạn junior hay bị rối nhất.

### Vòng đời request nhìn từ góc độ security

Với một request đi vào backend:

1. Spring Security chặn request trước controller
2. filter chain chạy
3. `JwtAuthenticationFilter` thử dựng user hiện tại từ token
4. nếu có auth hợp lệ, Spring Security mới kiểm tra quyền
5. nếu đủ quyền thì controller mới được chạy
6. nếu không có auth hoặc không đủ quyền thì trả 401/403

### Giải thích `SecurityConfig`

Method quan trọng nhất:

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
```

Ý nghĩa của `@Bean`:

- object trả về sẽ được Spring quản lý
- Spring Security sẽ dùng bean này làm cấu hình bảo mật chính

#### `csrf(csrf -> csrf.disable())`

Ý nghĩa:

- tắt CSRF
- phù hợp trong app stateless dùng JWT thay vì session-based form login

#### `httpBasic(httpBasic -> httpBasic.disable())`

Ý nghĩa:

- tắt cơ chế HTTP Basic Auth mặc định

#### `sessionManagement(...STATELESS)`

```java
.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
```

Ý nghĩa:

- không tạo session phía server
- mỗi request phải tự mang token

#### Rule route

```java
.requestMatchers("/api/auth/login").permitAll()
.requestMatchers("/api/auth/me").authenticated()
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.requestMatchers("/api/staff/**").hasAnyRole("STAFF", "ADMIN")
.requestMatchers("/api/lecturer/**").hasRole("LECTURER")
.requestMatchers("/api/student/**").hasRole("STUDENT")
.requestMatchers("/api/facility/**").hasRole("FACILITY")
.anyRequest().authenticated()
```

Giải thích:

- `/api/auth/login` là public
- `/api/auth/me` chỉ cần đã đăng nhập
- các route khác bị ràng theo role
- route không khai báo riêng vẫn phải authenticated

Điểm rất hay bị nhầm:

- `hasRole("ADMIN")` thực tế mong authority là `ROLE_ADMIN`
- vì vậy `CustomUserDetails.getAuthorities()` phải trả về `ROLE_` + role

#### `addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`

Ý nghĩa:

- filter JWT phải chạy trước filter username/password mặc định
- đến lúc kiểm tra quyền, security context đã có user nếu token hợp lệ

### Giải thích `JwtAuthenticationFilter`

Class này kế thừa `OncePerRequestFilter`.

Ý nghĩa:

- Spring đảm bảo filter này chỉ chạy một lần cho mỗi request

Đoạn code đầu:

```java
String authHeader = request.getHeader("Authorization");
if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    filterChain.doFilter(request, response);
    return;
}
```

Ý nghĩa:

- không có token thì bỏ qua bước auth JWT
- filter không tự chặn request ở đây

Tiếp theo:

```java
String username = jwtService.extractUsername(jwt);
```

Ý nghĩa:

- parse JWT và lấy `sub`

Tiếp theo:

```java
UserDetails userDetails = userDetailsService.loadUserByUsername(username);
```

Ý nghĩa:

- backend load lại user từ DB
- không tin hoàn toàn vào token

Điều kiện hợp lệ:

```java
if (userDetails.isEnabled() && jwtService.isTokenValid(jwt, userDetails)) {
```

Ở project này, `isEnabled()` nghĩa là:

- `is_active = true`
- `is_deleted = false`

Nếu hợp lệ, filter set authentication vào security context. Từ thời điểm đó trở đi, controller và authorization layer có thể biết "request này là ai".

### `UserDetails` và `UserDetailsService`

#### `CustomUserDetails`

Nó bọc `User` thành kiểu dữ liệu Spring Security hiểu được.

Method quan trọng:

```java
public Collection<? extends GrantedAuthority> getAuthorities() {
    return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
}
```

Ý nghĩa:

- biến role nghiệp vụ thành authority của Spring Security

Method:

```java
public boolean isEnabled() {
    return enabled;
}
```

Trong constructor:

- `enabled = user.isActive() && !user.isDeleted()`

Thiết kế này tốt vì trạng thái tài khoản được gom vào một nơi thống nhất.

#### `CustomUserDetailsService`

Method chính:

```java
User user = userRepository.findByUsernameAndIsDeletedFalse(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
```

Ý nghĩa:

- user soft delete sẽ không được Spring Security coi là user hợp lệ

### `PasswordEncoder`

Bean hiện tại:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

Vì sao dùng BCrypt:

- không lưu plain text password
- BCrypt có salt nội bộ
- cùng một password raw có thể tạo ra nhiều hash khác nhau
- đây là lựa chọn chuẩn khi trả lời phỏng vấn backend

Trong project này, nó được dùng ở 2 nơi chính:

- `SeedDataConfig` để tạo password hash
- `AuthService.login()` để so password

### `AuthenticationManager`

Project này không dùng `AuthenticationManager` cho login.

Bạn nên hiểu rõ để trả lời phỏng vấn:

- login endpoint đang xác thực thủ công ở `AuthService`
- nhưng request private vẫn đi qua hạ tầng Spring Security chuẩn
- nghĩa là project dùng Spring Security cho authorization và JWT reconstruction, chứ không dùng full username/password auth pipeline chuẩn cho endpoint login

### Luồng validate JWT

Trong `JwtService`, việc validate diễn ra theo 2 lớp:

1. parse và verify chữ ký:

```java
Jwts.parser()
    .verifyWith((javax.crypto.SecretKey) getSigningKey())
    .build()
    .parseSignedClaims(token)
```

Lớp này kiểm tra:

- token có đúng format không
- chữ ký có hợp lệ không

2. kiểm tra logic ứng dụng:

```java
return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
```

Lớp này kiểm tra:

- token có đúng user không
- token có hết hạn chưa

Nhận xét thật:

Project hiện tại không so claim `role` trong token với role hiện tại trong DB. Tuy nhiên authority cuối cùng vẫn lấy từ user load lại từ DB, nên thiết kế vẫn tương đối an toàn cho phạm vi hiện tại.

---

## Mapping Database

### Bảng `users` là bảng gốc của auth

Trong `v3.sql`, bảng `users` có các cột quan trọng:

```sql
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
```

Bảng này trả lời các câu hỏi auth cốt lõi:

- username là gì
- password hash là gì
- role là gì
- có active không
- có bị xóa mềm không
- lần login cuối là lúc nào

Vì vậy `users` là root auth table.

### Bảng profile theo role

#### `lecturers`

Liên kết với `users` qua `user_id`.

Mục đích:

- lưu thông tin đặc thù của giảng viên

Những field auth đang dùng:

- `id`
- `staff_code`
- `department_id`
- `full_name`
- `email`
- `phone`
- `is_deleted`

#### `students`

Liên kết với `users` qua `user_id`.

Những field auth đang dùng:

- `id`
- `student_code`
- `faculty_id`
- `class_name`
- `course_year`
- `phone`
- `is_deleted`

#### `facility_staff`

Liên kết với `users` qua `user_id`.

Những field auth đang dùng:

- `id`
- `staff_code`
- `building_id`
- `note`
- `is_deleted`

### Field trạng thái và điều kiện được login

2 field cực quan trọng của `users` là:

- `is_active`
- `is_deleted`

Hành vi hiện tại:

- `is_deleted = true`
  - bị loại ngay từ query repository
  - backend coi như user không tồn tại

- `is_active = false`
  - vẫn tìm thấy user
  - nhưng bị chặn bởi `InactiveAccountException`
  - trả về `403 Forbidden`

Đây là phân biệt rất hợp lý:

- deleted = tài khoản không còn nằm trong luồng sử dụng bình thường
- inactive = tài khoản vẫn còn nhưng tạm thời không được phép đăng nhập

### `last_login_at`

Field này được cập nhật mỗi khi login thành công.

Nó hữu ích cho:

- audit
- support người dùng
- quan sát hoạt động hệ thống
- bảo mật cơ bản

Code hiện tại:

```java
user.setLastLoginAt(LocalDateTime.now());
userRepository.save(user);
```

### `audit_logs`

Bảng này lưu dấu vết hoạt động nhạy cảm.

Trong phạm vi module auth hiện tại, nó đang dùng để ghi login thành công.

Thông tin được ghi:

- `user_id`
- `action = LOGIN`
- `table_name = users`
- `record_id = user.id`
- `ip_address`
- `new_values` chứa JSON nhỏ mô tả lần login

Nhận xét thật:

Hiện tại project chưa log login thất bại. Ở môi trường production, đây thường là thứ nên có.

---

## Giải Thích Syntax Quan Trọng

Phần này không giải thích từng dòng một cách máy móc, mà tập trung vào những cú pháp quan trọng nhất trong module auth.

### Annotation

#### `@RestController`

Ý nghĩa:

- đánh dấu class là controller REST
- return value sẽ được serialize thành JSON

#### `@RequestMapping("/api/auth")`

Ý nghĩa:

- mọi endpoint trong controller này đều có prefix `/api/auth`

#### `@PostMapping("/login")`, `@GetMapping("/me")`

Ý nghĩa:

- map HTTP method + path vào một method Java

#### `@Service`

Ý nghĩa:

- class thuộc service layer
- được Spring quản lý như một bean

#### `@Configuration`

Ý nghĩa:

- class chứa cấu hình hoặc bean definition

#### `@Bean`

Ý nghĩa:

- method trả về object mà Spring cần quản lý

Trong project này, ví dụ rõ nhất là:

- `SecurityFilterChain`
- `PasswordEncoder`
- `CommandLineRunner` seed

#### `@ConfigurationProperties(prefix = "app.jwt")`

Ý nghĩa:

- map config `app.jwt.*` vào class Java

#### `@EnableConfigurationProperties(JwtProperties.class)`

Ý nghĩa:

- nói với Spring rằng class `JwtProperties` cần được bind cấu hình

#### `@EnableMethodSecurity`

Ý nghĩa:

- chuẩn bị nền cho `@PreAuthorize` sau này
- hiện tại project chưa dùng nhiều nhưng cấu hình này là hướng đi đúng

#### `@Transactional`

Ý nghĩa:

- Spring mở transaction quanh method

Tại sao quan trọng ở đây:

- login vừa update user, vừa ghi audit log
- `/me` đánh dấu `readOnly = true` để thể hiện rõ ý đồ

### Constructor injection

Ví dụ:

```java
public AuthService(UserRepository userRepository,
                   LecturerRepository lecturerRepository,
                   StudentRepository studentRepository,
                   FacilityStaffRepository facilityStaffRepository,
                   PasswordEncoder passwordEncoder,
                   JwtService jwtService,
                   AuditLogService auditLogService) {
```

Ý nghĩa:

- Spring truyền dependency qua constructor
- dependency của class được thể hiện rõ ràng
- dễ test hơn field injection

### Repository query method

Ví dụ:

```java
Optional<User> findByUsernameAndIsDeletedFalse(String username);
```

Đây là derived query method của Spring Data JPA.

Spring tự hiểu:

- tìm theo `username`
- và thêm điều kiện `is_deleted = false`

Đây là điểm rất mạnh của Spring Data JPA vì không cần tự viết SQL cho query đơn giản.

### Enum

Project có các enum chính:

- `UserRole`
- `AuditAction`

Vì sao enum tốt:

- tránh hard-code string lung tung
- giới hạn giá trị hợp lệ
- refactor an toàn hơn

Mapping trong entity:

```java
@Enumerated(EnumType.STRING)
private UserRole role;
```

Ý nghĩa:

- lưu enum dưới dạng text như `ADMIN`
- không lưu dạng số ordinal

Đây là lựa chọn đúng cho hệ thống thực tế.

### `Optional`

Ví dụ trong auth service:

```java
lecturerRepository.findByUserId(userId)
        .filter(profile -> !profile.isDeleted())
        .orElseThrow(() -> new UserProfileInconsistentException("User profile data is inconsistent"));
```

Đọc theo nghĩa logic:

1. tìm profile theo `userId`
2. nếu có thì chỉ giữ profile chưa bị delete
3. nếu không còn gì thì ném exception

Đây là cách viết gọn và rõ hơn rất nhiều so với nhiều lớp `if`.

### Lambda

Ví dụ:

```java
orElseThrow(() -> new BadCredentialsException("Invalid username or password"));
```

Ý nghĩa:

- truyền vào một hàm tạo exception
- chỉ chạy khi Optional rỗng

### Syntax sinh và parse JWT

Sinh token:

```java
return Jwts.builder()
        .claims(claims)
        .subject(userDetails.getUsername())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
        .signWith(getSigningKey())
        .compact();
```

Ý nghĩa từng phần:

- `.claims(claims)`: thêm custom claims
- `.subject(...)`: set `sub`
- `.issuedAt(...)`: thời điểm phát token
- `.expiration(...)`: thời điểm hết hạn
- `.signWith(...)`: ký token bằng secret key
- `.compact()`: nén thành chuỗi JWT hoàn chỉnh

Parse token:

```java
return Jwts.parser()
        .verifyWith((javax.crypto.SecretKey) getSigningKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();
```

Ý nghĩa:

- verify chữ ký
- parse token
- lấy phần payload claims

### Logic filter chain

Dòng rất quan trọng:

```java
SecurityContextHolder.getContext().setAuthentication(authenticationToken);
```

Ý nghĩa:

- từ đây Spring Security hiểu request hiện tại đã được xác thực
- controller và authorization layer có thể lấy principal hiện tại

Nếu không có dòng này, `/api/auth/me` sẽ không biết user hiện tại là ai.

### Matcher và authorization syntax

Ví dụ:

```java
.requestMatchers("/api/staff/**").hasAnyRole("STAFF", "ADMIN")
```

Ý nghĩa:

- cả staff và admin đều được vào nhóm API của staff

Đây là một rule nghiệp vụ tương đối thực tế: admin có thể thao tác thay staff.

### Exception handling syntax

Ví dụ:

```java
@ExceptionHandler(BadCredentialsException.class)
public ResponseEntity<ErrorResponse> handleBadCredentials(RuntimeException exception) {
    return build(HttpStatus.UNAUTHORIZED, "Invalid username or password", null);
}
```

Ý nghĩa:

- khi exception này thoát ra khỏi controller/service
- `GlobalExceptionHandler` sẽ chuyển nó thành HTTP response đồng nhất

Đây là thiết kế tốt vì:

- service tập trung vào business logic
- exception handler tập trung vào API error format

---

## Logic Role Và Authorization

### Authentication khác gì Authorization

Đây là câu hỏi gần như chắc chắn có trong phỏng vấn.

Authentication là:

- xác minh bạn là ai

Authorization là:

- xác minh bạn được làm gì

Trong project này:

- authentication xảy ra khi:
  - login kiểm tra username/password
  - request private kiểm tra JWT và dựng lại user hiện tại

- authorization xảy ra khi:
  - `SecurityConfig` kiểm tra route có phù hợp role không

### 5 role đang được xử lý thế nào

Ở tầng auth, role ảnh hưởng tới:

- `permissions`
- `redirectPath`
- profile nào được load

Mapping `redirectPath` hiện tại:

- `ADMIN -> /admin`
- `STAFF -> /staff`
- `LECTURER -> /lecturer`
- `STUDENT -> /student`
- `FACILITY -> /facility`

`permissions` hiện tại được tạo rất đơn giản:

```java
return List.of("ROLE_" + user.getRole().name());
```

### Mỗi role được vào đâu

Theo `SecurityConfig`:

- `ADMIN`
  - vào `/api/admin/**`
  - vào `/api/staff/**`
  - vào các API authenticated khác nếu phù hợp

- `STAFF`
  - vào `/api/staff/**`

- `LECTURER`
  - vào `/api/lecturer/**`

- `STUDENT`
  - vào `/api/student/**`

- `FACILITY`
  - vào `/api/facility/**`

### Vì sao backend vẫn phải kiểm tra dù frontend đã ẩn nút

Frontend chỉ là lớp giao diện.

Nếu frontend ẩn nút nhưng backend không kiểm tra quyền, người dùng vẫn có thể:

- mở Postman
- gọi trực tiếp API
- sửa request bằng tool khác

Vì vậy backend luôn phải kiểm tra:

- token có hợp lệ không
- role có đúng không
- account có active không
- dữ liệu có thuộc phạm vi của user hiện tại không

Ví dụ những thứ backend vẫn phải kiểm tra thêm sau này:

- student chỉ được xem lịch học của chính mình
- lecturer chỉ được xem lịch dạy của mình
- facility có thể chỉ được thao tác ở building của mình

---

## Ví Dụ Request/Response

### Request login

```json
{
  "username": "admin01",
  "password": "123456"
}
```

### Response login thành công

Ví dụ đại diện theo DTO hiện tại:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 1,
      "username": "admin01",
      "email": "admin01@ptit.edu.vn",
      "fullName": "System Admin",
      "role": "ADMIN",
      "active": true
    },
    "profile": null,
    "permissions": [
      "ROLE_ADMIN"
    ],
    "redirectPath": "/admin"
  }
}
```

Lưu ý:

Field boolean trong record có thể serialize thành `active` thay vì `isActive` tùy cách Jackson xử lý. Khi demo thực tế, bạn nên kiểm tra response runtime.

### Response login thất bại

Sai mật khẩu:

```json
{
  "success": false,
  "message": "Invalid username or password",
  "errors": null,
  "timestamp": "2026-04-17T10:30:00"
}
```

Tài khoản inactive:

```json
{
  "success": false,
  "message": "Account is inactive",
  "errors": null,
  "timestamp": "2026-04-17T10:30:00"
}
```

### Response `/api/auth/me` cho admin

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "admin01",
      "email": "admin01@ptit.edu.vn",
      "fullName": "System Admin",
      "role": "ADMIN",
      "active": true
    },
    "profile": null,
    "permissions": [
      "ROLE_ADMIN"
    ],
    "redirectPath": "/admin"
  }
}
```

### Response `/api/auth/me` cho lecturer

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "id": 3,
      "username": "lect01",
      "email": "lect01@ptit.edu.vn",
      "fullName": "Lecturer One",
      "role": "LECTURER",
      "active": true
    },
    "profile": {
      "lecturerId": 1,
      "staffCode": "LECT001",
      "departmentId": 1,
      "fullName": "Lecturer One",
      "email": "lect01@ptit.edu.vn",
      "phone": "0900000001"
    },
    "permissions": [
      "ROLE_LECTURER"
    ],
    "redirectPath": "/lecturer"
  }
}
```

### Response `/api/auth/me` cho student

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "id": 4,
      "username": "sv001",
      "email": "sv001@ptit.edu.vn",
      "fullName": "Student One",
      "role": "STUDENT",
      "active": true
    },
    "profile": {
      "studentId": 1,
      "studentCode": "B21DCCN001",
      "facultyId": 1,
      "className": "D21CQCN01-B",
      "courseYear": 2021,
      "phone": "0900000002"
    },
    "permissions": [
      "ROLE_STUDENT"
    ],
    "redirectPath": "/student"
  }
}
```

### Response `/api/auth/me` cho facility

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "id": 5,
      "username": "fac01",
      "email": "fac01@ptit.edu.vn",
      "fullName": "Facility One",
      "role": "FACILITY",
      "active": true
    },
    "profile": {
      "facilityStaffId": 1,
      "staffCode": "FAC001",
      "buildingId": 1,
      "note": "Default facility test account"
    },
    "permissions": [
      "ROLE_FACILITY"
    ],
    "redirectPath": "/facility"
  }
}
```

---

## Các Lỗi Thường Gặp Và Cách Debug

### 1. Sai password hash

Biểu hiện:

- login luôn trả `401 Invalid username or password`

Cần kiểm tra:

- cột `users.password_hash` có đúng là BCrypt hash không
- hash có dạng bắt đầu bằng `$2a$`, `$2b$`, `$2y$` hay không
- password test có đúng password đã hash hay không

Điểm bám đúng project:

- `SeedDataConfig` hash password `"123456"`
- nếu bạn insert thẳng plain text vào DB thì login sẽ fail

Vì backend đang dùng:

```java
passwordEncoder.matches(request.password(), user.getPasswordHash())
```

### 2. Sai role hoặc role mismatch

Biểu hiện:

- login thành công
- nhưng gọi API private bị `403 Forbidden`

Cần kiểm tra:

- `users.role` trong DB
- authority do `CustomUserDetails` sinh ra
- rule route trong `SecurityConfig`

Ví dụ:

- user role `STAFF` thì không được vào `/api/admin/**`

### 3. Account inactive

Biểu hiện:

- login trả `403 Account is inactive`

Cần kiểm tra:

- `users.is_active`

Vị trí fail:

```java
if (!user.isActive()) {
    throw new InactiveAccountException("Account is inactive");
}
```

### 4. JWT invalid hoặc expired

Biểu hiện:

- `/api/auth/me` trả `401`
- endpoint private khác cũng trả `401`

Cần kiểm tra:

- header có đúng dạng `Authorization: Bearer <token>` không
- token đã hết hạn chưa
- `app.jwt.secret` có bị đổi sau khi token được phát không

Điểm quan trọng của project:

- `JwtAuthenticationFilter` bắt `JwtException` và clear context
- request không có auth sẽ đi tiếp đến bước authorization
- endpoint private sau đó bị chặn với `401`

### 5. `/me` trả sai profile hoặc 500

Biểu hiện:

- admin/staff login ổn
- nhưng lecturer/student/facility bị lỗi `User profile data is inconsistent`

Cần kiểm tra:

- bảng `lecturers`, `students`, `facility_staff` có row tương ứng với `user_id` không
- row đó có `is_deleted = false` không

Vị trí fail:

```java
.orElseThrow(() -> new UserProfileInconsistentException("User profile data is inconsistent"));
```

Đây là lỗi rất thực tế với hệ thống tài khoản cấp sẵn: bảng auth đúng nhưng bảng profile nghiệp vụ bị thiếu.

### 6. Nhầm 401 và 403

Trong project này:

- `401 Unauthorized` thường là:
  - không có token
  - token sai
  - token hết hạn
  - sai username/password khi login

- `403 Forbidden` thường là:
  - account inactive
  - đã đăng nhập nhưng không đúng role của endpoint

Quy tắc nhớ nhanh:

- 401 = chưa được xác thực hợp lệ
- 403 = đã có danh tính nhưng không được phép

### 7. Seed data chạy lỗi

Biểu hiện:

- bật `app.seed.enabled = true`
- nhưng một số role vẫn login lỗi hoặc app fail khi startup

Cần kiểm tra:

- `faculties.id = 1`
- `departments.id = 1`
- `buildings.id = 1`

Vì `SeedDataConfig` đang giả định sẵn các master data đó tồn tại.

### 8. Token dùng được trước đó nhưng đột nhiên không dùng được nữa

Nguyên nhân có thể là:

- user bị set inactive
- user bị soft delete

Vì sao project vẫn xử lý khá ổn:

- request private luôn load lại user từ DB
- `userDetails.isEnabled()` phải còn đúng thì token mới được chấp nhận

---

## Chuẩn Bị Phỏng Vấn

### Câu hỏi thường gặp và cách trả lời

#### 1. JWT là gì và vì sao dùng JWT ở đây?

Trả lời mẫu:

"JWT là một loại token có chữ ký, cho phép backend xác định user mà không cần lưu session phía server. Trong project này, sau khi login thành công, backend phát access token chứa username ở subject và các claim như userId, role. Ở mỗi request private, JWT filter sẽ validate token và dựng lại user trong Spring Security context."

#### 2. Spring Security hoạt động thế nào trong module này?

Trả lời mẫu:

"Em cấu hình `SecurityFilterChain` để ứng dụng chạy stateless, khai báo route public và protected, rồi thêm `JwtAuthenticationFilter` trước `UsernamePasswordAuthenticationFilter`. Filter sẽ đọc bearer token, validate token, load lại user từ database qua `UserDetailsService`, rồi đặt authentication vào `SecurityContextHolder`. Sau đó Spring Security mới kiểm tra rule như `hasRole`."

#### 3. Vì sao dùng BCrypt?

Trả lời mẫu:

"BCrypt là thuật toán hash mật khẩu phổ biến và phù hợp cho auth. Nó chậm hơn hash thông thường nên chống brute force tốt hơn, và có salt nội bộ. Trong project này em dùng `BCryptPasswordEncoder`, khi login thì so bằng `matches(rawPassword, passwordHash)`."

#### 4. `UserDetails` là gì?

Trả lời mẫu:

"`UserDetails` là representation mà Spring Security dùng để hiểu một user đã xác thực. Em tạo `CustomUserDetails` để bọc entity `User`, cung cấp username, password hash, authorities và trạng thái enabled."

#### 5. Authentication và authorization khác nhau thế nào?

Trả lời mẫu:

"Authentication là xác minh người dùng là ai, ví dụ kiểm tra username/password hoặc JWT. Authorization là xác minh người đó được phép làm gì. Trong project của em, login và JWT validation là authentication, còn rule route trong `SecurityConfig` là authorization."

#### 6. Project này xử lý role-based access control như thế nào?

Trả lời mẫu:

"Bảng `users` lưu một role nghiệp vụ. `CustomUserDetails` chuyển role đó thành authority dạng `ROLE_*`. `SecurityConfig` dùng các matcher như `hasRole('LECTURER')`, `hasAnyRole('STAFF', 'ADMIN')` để bảo vệ endpoint."

#### 7. Vì sao `users` là root auth table?

Trả lời mẫu:

"Vì mọi tài khoản dù là admin, staff, lecturer, student hay facility đều cần chung các field xác thực như username, email, password hash, role, active status, deleted status. Còn dữ liệu nghiệp vụ đặc thù thì nằm ở bảng profile riêng liên kết qua `user_id`."

#### 8. Audit log của login quan trọng thế nào?

Trả lời mẫu:

"Login là sự kiện nhạy cảm về bảo mật. Ghi lại user id, action, IP, thời điểm login giúp truy vết, điều tra sự cố và theo dõi hoạt động hệ thống. Trong project này em ghi login thành công vào `audit_logs` với action `LOGIN`."

#### 9. Vì sao `/api/auth/me` hữu ích?

Trả lời mẫu:

"Sau khi login, frontend thường cần một nguồn dữ liệu đáng tin về user hiện tại. `/me` giúp frontend dùng token để lấy lại thông tin user, role, profile và permissions từ backend thay vì tin hoàn toàn vào dữ liệu lưu cục bộ."

#### 10. Nếu mở rộng hệ thống, em sẽ làm gì tiếp?

Trả lời mẫu:

"Em sẽ thêm refresh token, log login thất bại, lock account sau nhiều lần sai mật khẩu, forgot password, method-level authorization bằng `@PreAuthorize`, và có thể mở rộng từ role-based sang permission-based nếu nghiệp vụ phức tạp hơn."

---

## Cách Tự Giải Thích Module Này Bằng Lời Của Mình

### Bản ngắn để trả lời phỏng vấn

"Đây là module login/auth dùng Spring Boot, Spring Security và JWT cho 5 role. Bảng `users` là bảng gốc để xác thực, còn lecturer, student và facility có profile riêng ở bảng khác. Khi login, backend kiểm tra username, BCrypt password hash, trạng thái active, cập nhật `last_login_at`, sinh JWT và ghi `audit_logs`. Với request private, JWT filter sẽ validate token và dựng lại user trong security context để phân quyền theo role."

### Bản vừa để trình bày project

"Project của em dùng mô hình tài khoản cấp sẵn trong database, không có sign-up công khai. Vì vậy phần auth xoay quanh bảng `users` làm root auth table, còn các vai trò như lecturer, student, facility có profile ở bảng riêng. API login nhận username/password, service kiểm tra tài khoản, chặn account inactive, so khớp BCrypt hash, cập nhật thời gian login cuối, sinh JWT có claim `userId` và `role`, load profile theo role, rồi ghi audit log login. Sau đó các request private đi qua `JwtAuthenticationFilter`, filter sẽ validate token, load lại user từ DB, set authentication vào `SecurityContextHolder`, và Spring Security dùng role để chặn hoặc cho qua các endpoint."

### Bản kỹ thuật hơn cho vị trí backend developer

"Module này dùng `SecurityFilterChain` theo kiểu stateless và chèn `JwtAuthenticationFilter` trước `UsernamePasswordAuthenticationFilter`. Login endpoint không đi qua `AuthenticationManager` mà `AuthService` tự xác thực bằng `PasswordEncoder.matches` đối với `users.password_hash`. Sau khi xác thực thành công, service update `last_login_at`, map `User` sang `CustomUserDetails`, generate JWT bằng `jjwt`, resolve profile theo role thông qua repository tương ứng, và ghi một bản ghi `LOGIN` vào `audit_logs`. Với các request đã đăng nhập, filter đọc bearer token, parse và verify chữ ký, load lại user bằng `CustomUserDetailsService`, kiểm tra `isEnabled`, rồi set `UsernamePasswordAuthenticationToken` vào `SecurityContextHolder`. Authorization được áp dụng qua route matcher trong `SecurityConfig`."

---

## Bài Tập Tự Học

### 1. Thêm forgot-password

Nên học trước:

- `User`
- `UserRepository`
- `AuthService`
- `PasswordEncoder`

Bạn cần nghĩ về:

- reset token sinh ra thế nào
- lưu ở đâu
- hết hạn thế nào
- update `password_hash` ra sao cho an toàn

### 2. Thêm refresh token

Nên học trước:

- `JwtService`
- `SecurityConfig`
- `AuthController`
- `AuthService`

Bạn cần nghĩ về:

- vai trò khác nhau giữa access token và refresh token
- rotation strategy
- revoke hoặc lưu refresh token như thế nào

### 3. Thêm audit log cho login thất bại

Nên học trước:

- `AuthService.login(...)`
- `AuditLogService`
- schema `audit_logs`

Bạn cần nghĩ về:

- user không tồn tại thì log gì
- có lưu attempted username không
- làm sao log đủ dùng nhưng không rò rỉ thông tin nhạy cảm

### 4. Thêm lock account sau nhiều lần login sai

Nên học trước:

- `User`
- `AuthService`
- `GlobalExceptionHandler`

Bạn cần nghĩ về:

- thêm field nào vào bảng `users`
- reset counter lúc login thành công ra sao
- phân biệt locked và inactive thế nào

### 5. Giới hạn endpoint theo role hoặc theo phạm vi dữ liệu

Nên học trước:

- `SecurityConfig`
- `CustomUserDetails`
- controller/service nghiệp vụ sau này

Bạn cần nghĩ về:

- khi nào route-based role check là đủ
- khi nào phải kiểm tra ownership ở service layer

### 6. Thêm `@PreAuthorize`

Nên học trước:

- `SecurityConfig`
- `@EnableMethodSecurity`
- Spring Expression Language

Bạn cần nghĩ về:

- đưa authorization sát business method
- tránh phụ thuộc hoàn toàn vào URL pattern

### 7. Thêm logout với blacklist token

Nên học trước:

- `JwtService`
- `JwtAuthenticationFilter`
- thiết kế DB hoặc cache

Bạn cần nghĩ về:

- giới hạn của stateless JWT
- revoke token sẽ đánh đổi gì về hiệu năng và độ phức tạp

### 8. Mở rộng từ role sang permission chi tiết hơn

Nên học trước:

- `UserRole`
- `CustomUserDetails.getAuthorities()`
- `SecurityConfig`

Bạn cần nghĩ về:

- role và permission khác nhau ra sao
- một user có thể có nhiều authority hay không
- schema DB cần đổi thế nào

---

## Đánh Giá Thẳng Thắn Về Thiết Kế Hiện Tại

Điểm mạnh:

- tách layer rõ: controller, service, repository, security
- dùng BCrypt đúng cách
- flow JWT stateless khá sạch
- xử lý được `is_active` và `is_deleted`
- có audit log login
- có `/me` để frontend lấy current user

Điểm đơn giản hóa / hạn chế:

- login chưa dùng `AuthenticationManager`
- chưa có refresh token
- chưa log login thất bại
- chưa có lock account
- chưa có revoke/logout thực sự
- authorization mới ở mức route + role
- seed data phụ thuộc master data có sẵn
- `profile` dùng kiểu `Object`, nhanh nhưng chưa mạnh về type safety

Nếu đưa lên production, nên cải tiến:

- thêm refresh token
- thêm login failure monitoring
- thêm account lock / rate limiting
- thêm permission chi tiết hơn role
- thêm revoke/token versioning
- thêm test coverage

---

## Dependency Map

### Luồng request login

- `AuthController.login(...)`
  - gọi `AuthService.login(...)`
    - gọi `UserRepository.findByUsernameAndIsDeletedFalse(...)`
    - dùng `PasswordEncoder.matches(...)`
    - gọi `UserRepository.save(...)`
    - tạo `CustomUserDetails`
    - gọi `JwtService.generateToken(...)`
    - gọi repository profile theo role
    - gọi `AuditLogService.logLogin(...)`
      - gọi `AuditLogRepository.save(...)`

### Luồng request `/me`

- `JwtAuthenticationFilter`
  - gọi `JwtService.extractUsername(...)`
  - gọi `CustomUserDetailsService.loadUserByUsername(...)`
    - gọi `UserRepository.findByUsernameAndIsDeletedFalse(...)`
  - gọi `JwtService.isTokenValid(...)`
  - set auth vào `SecurityContextHolder`

- `AuthController.me(...)`
  - gọi `AuthService.getCurrentUser(...)`
    - gọi `UserRepository.findByUsernameAndIsDeletedFalse(...)`
    - gọi repository profile theo role

### Nhóm cấu hình và hỗ trợ

- `SecurityConfig`
  - đăng ký `SecurityFilterChain`
  - inject `JwtAuthenticationFilter`
  - cung cấp `PasswordEncoder`

- `JwtService`
  - phụ thuộc `JwtProperties`

- `AuditLogService`
  - phụ thuộc `AuditLogRepository`
  - phụ thuộc `ObjectMapper`

- `SeedDataConfig`
  - phụ thuộc repository
  - phụ thuộc `PasswordEncoder`

---

## Thứ Tự Nên Đọc Code

Nếu muốn học module này chắc từ gốc, tôi khuyên đọc theo thứ tự sau:

1. `v3.sql`
   Hiểu bảng `users`, `lecturers`, `students`, `facility_staff`, `audit_logs` trước.

2. `user/entity/User.java` và `user/enumtype/UserRole.java`
   Đây là lõi danh tính của user.

3. `auth/controller/AuthController.java`
   Xem API công khai đang có những gì.

4. `auth/service/AuthService.java`
   Đây là trái tim của luồng login và `/me`.

5. `auth/jwt/JwtService.java`
   Hiểu token được sinh và parse thế nào.

6. `auth/security/CustomUserDetails.java` và `auth/security/CustomUserDetailsService.java`
   Hiểu Spring Security nhìn user của bạn theo cách nào.

7. `auth/security/JwtAuthenticationFilter.java`
   Hiểu request private được xác thực lại ra sao.

8. `config/SecurityConfig.java`
   Hiểu toàn bộ luật bảo mật và route authorization.

9. `audit/service/AuditLogService.java`
   Hiểu login audit được ghi ra sao.

10. `common/exception/GlobalExceptionHandler.java`
   Hiểu lỗi được convert thành response như thế nào.

11. `config/SeedDataConfig.java`
   Đọc cuối cùng như phần hỗ trợ test local, không phải lõi auth.

Nếu bạn có thể tự giải thích lại trôi chảy các file này theo đúng thứ tự trên mà không cần nhìn code, thì bạn đã hiểu module này đủ tốt cho phỏng vấn backend ở mức junior đến early-mid.
