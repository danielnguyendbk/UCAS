# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

University Classroom Allocation System (UCAS / QLPHONGHOC) — a full-stack web app for managing classroom scheduling at PTIT. Roles: ADMIN, STAFF, LECTURER, STUDENT, FACILITY.

## Commands

### Backend (Spring Boot, Java 17, Maven)
```bash
cd backend
mvn spring-boot:run          # Start backend on port 8080
mvn test                     # Run all tests
mvn test -Dtest=ClassName    # Run a single test class
mvn clean package            # Build JAR
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                  # Start dev server on port 5173
npm run build
```

### Database
- MySQL database named `QLPHONGHOC`
- Schema: `backend/docs/schema.sql`
- Seed data: `backend/docs/schema_seed.sql`
- Backend config: `backend/src/main/resources/application.yml` (set DB credentials here)
- Frontend API base URL configured via `frontend/.env` (copy from `.env.example`): `VITE_API_BASE_URL=http://localhost:8080`

## Architecture

### Backend (`backend/src/main/java/com/ptit/qlphonghoc/`)

Standard Spring Boot layered architecture: **Controller → Service → Repository → JPA Entity**.

Key modules:
- `auth/` — JWT authentication (JJWT), BCrypt, stateless sessions, password reset via email
- `admin/` — Admin controllers + `timetableimport/` sub-package for Excel import (Apache POI) with preview/validate/apply flow
- `staff/` — Staff allocation, class section assignment, dashboard
- `timetableworkflow/` — Timetable lifecycle: `DRAFT → VALIDATED → APPROVED → PUBLISHED → LOCKED`
- `classsession/` — Specific scheduled class instances (vs. `schedules` which are weekly patterns)
- `common/` — Global exception handler, standard `ApiResponse<T>` wrapper for all responses
- `config/` — Spring Security config (CORS, JWT filter), `SeedDataConfig` for initial DB population

**API base paths:** `/api/auth`, `/api/admin`, `/api/staff`, `/api/lecturer`, `/api/student`, `/api/facility`, `/api/dashboard`

### Frontend (`frontend/src/`)

Feature-based React app:
- `app/` — Root layout, route definitions (`app/routes/index.jsx`), `AuthContext`
- `features/` — Domain modules: `admin/`, `staff/`, `auth/`, `lecturer/`, `student/`, `timetable/`
- `components/` — Shared UI (built on Radix UI + shadcn/ui + Tailwind CSS 4)
- `services/` — Axios-based API client; feature services live under their `features/*/` directory
- `hooks/` — Custom hooks (e.g. `useAuth`, `useStaffDashboard`, `useTimetableData`)
- `constants/` — Navigation, route paths, allocation constants

### Database Naming Conventions
- Use `classrooms` (not rooms), `class_sections` (not course sections), `class_sessions` (specific dated instances vs. `schedules` for recurring weekly patterns)
- PKs follow full name pattern: `user_id`, `classroom_id`, `department_id`

## Key Domain Concepts

- **Timetable workflow**: Timetables go through a fixed status lifecycle. Edits are only allowed in certain states; workflow transitions are enforced in `timetableworkflow/`.
- **Timetable import**: Admins upload Excel files; the flow is Preview → Validate → Apply (three separate API calls). Logic lives in `admin/timetableimport/`.
- **Split section**: Admin can split a class section to resolve capacity conflicts (`admin/controller/AdminClassSectionController`).
- **Schedules vs. class_sessions**: `schedules` define recurring weekly time slots; `class_sessions` are concrete dated occurrences generated from them.
