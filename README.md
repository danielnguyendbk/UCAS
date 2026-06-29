# UCAS - University Classroom Allocation System

UCAS là hệ thống quản lý, xếp lịch và phân bổ phòng học cho môi trường đại học. Project gồm backend Spring Boot, frontend React/Vite và bộ tài liệu SQL phục vụ khởi tạo cơ sở dữ liệu.

## Tính năng chính

- Đăng nhập, JWT authentication, đổi mật khẩu và quên mật khẩu.
- Phân quyền theo vai trò: `ADMIN`, `STAFF`, `LECTURER`, `STUDENT`, `FACILITY`.
- Quản lý danh mục: người dùng, giảng viên, sinh viên, khoa/bộ môn, học phần, tòa nhà, phòng học, tiết học.
- Import thời khóa biểu và lịch thi từ Excel, xem trước dữ liệu và ghi audit log.
- Phân bổ phòng học, tự động gán phòng, kiểm tra xung đột lịch/phòng/giảng viên.
- Quy trình duyệt, xuất bản, khóa/mở thời khóa biểu và lịch thi.
- Mượn phòng, đổi phòng đột xuất, yêu cầu bảo trì phòng học.
- Giao diện riêng cho admin, phòng đào tạo, giảng viên, sinh viên và nhân viên cơ sở vật chất.

## Công nghệ sử dụng

### Backend

- Java 17
- Spring Boot 3.3.5
- Spring Security + JWT
- Spring Data JPA
- MySQL
- Apache POI cho import/export Excel
- Maven

### Frontend

- React 18
- Vite 6
- MUI, Radix UI, Tailwind CSS
- Axios
- React Router

## Cấu trúc thư mục

```text
.
├── backend/                 # Spring Boot API
│   ├── docs/                # Schema SQL và seed data
│   ├── src/main/java/       # Source code backend
│   └── src/main/resources/  # application.yml
├── frontend/                # React/Vite UI
│   ├── src/                 # Source code frontend
│   └── package.json
├── docs/                    # Tài liệu, sample import, báo cáo
└── README.md
```

## Yêu cầu môi trường

- JDK 17+
- Maven 3.9+ hoặc Maven được tích hợp trong IDE
- Node.js 18+
- npm
- MySQL 8+

## Thiết lập database

Tạo database MySQL:

```sql
CREATE DATABASE QLPHONGHOC CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Import schema:

```bash
mysql -u root -p QLPHONGHOC < backend/docs/schema.sql
```

Nếu cần dữ liệu demo, import file seed trong `backend/docs/`:

```bash
mysql -u root -p QLPHONGHOC < backend/docs/seed_ucas_2025_2026_hk2_w23_44_.sql
```

Lưu ý: file seed demo có thể xóa và tạo lại dữ liệu mẫu liên quan. Không chạy trên database đang chứa dữ liệu thật.

## Cấu hình backend

Backend đọc cấu hình từ biến môi trường, có giá trị mặc định trong `backend/src/main/resources/application.yml`.

Các biến thường dùng:

```env
SERVER_PORT=8080
DB_URL=jdbc:mysql://localhost:3306/QLPHONGHOC?useSSL=false&serverTimezone=Asia/Bangkok&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=your_password
JWT_SECRET=base64_secret_key
JWT_EXPIRATION=86400000
FRONTEND_BASE_URL=http://localhost:5173
MAIL_ENABLED=false
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=no-reply@ucas.local
SEED_ENABLED=false
```

Không commit file `.env`, mật khẩu database, JWT secret hoặc thông tin SMTP thật.

## Chạy backend

```bash
cd backend
mvn spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8080
```

## Chạy frontend

Tạo file `frontend/.env` từ file mẫu:

```bash
cd frontend
cp .env.example .env
```

Nội dung mặc định:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Cài dependency và chạy dev server:

```bash
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

## Build

Build backend:

```bash
cd backend
mvn clean package
```

Build frontend:

```bash
cd frontend
npm run build
```

## Tài khoản demo

Nếu import seed demo, mật khẩu demo được ghi trong file seed. Kiểm tra phần đầu file:

```text
backend/docs/seed_ucas_2025_2026_hk2_w23_44_.sql
```

## Ghi chú phát triển

- API chính dùng prefix `/api`.
- Frontend gọi backend qua `VITE_API_BASE_URL`.
- File upload bảo trì được ghi vào thư mục runtime `backend/uploads/`.
- Các thư mục sinh ra như `node_modules/`, `dist/`, `target/`, `backend/uploads/`, log và file môi trường local không nên commit.
