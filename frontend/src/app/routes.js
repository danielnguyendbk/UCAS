import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { MainLayout } from "./components/MainLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ClassroomsPage } from "./pages/ClassroomsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { LecturersPage } from "./pages/LecturersPage";
import { TimetablePage } from "./pages/TimetablePage";
import { AutoAssignmentPage } from "./pages/AutoAssignmentPage";
import { WeeklySchedulePage } from "./pages/WeeklySchedulePage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { StaffSectionsPage } from "./pages/StaffSectionsPage";
import { StaffSchedulePage } from "./pages/StaffSchedulePage";
import { StaffAllocationPage } from "./pages/StaffAllocationPage";
import { StaffLookupPage } from "./pages/StaffLookupPage";
import { StaffBookingsPage } from "./pages/StaffBookingsPage";
import { StaffBookingListPage } from "./pages/StaffBookingListPage";
import { StaffRoomChangeListPage } from "./pages/StaffRoomChangeListPage";
// Lecturer pages
import { LecturerSchedulePage } from "./pages/LecturerSchedulePage";
import { LecturerBookingPage } from "./pages/LecturerBookingPage";
import { LecturerBookingHistoryPage } from "./pages/LecturerBookingHistoryPage";
import { LecturerMaintenanceRequestPage } from "./pages/LecturerMaintenanceRequestPage";
import { LecturerMaintenanceHistoryPage } from "./pages/LecturerMaintenanceHistoryPage";
import { LecturerRoomChangeRequestPage } from "./pages/LecturerRoomChangeRequestPage";
import { LecturerRoomChangeListPage } from "./pages/LecturerRoomChangeListPage";
// Other roles
import { EmployeePage } from "./pages/EmployeePage";
import { StudentPage } from "./pages/StudentPage";

const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
      // Admin routes
      { index: true, Component: DashboardPage },
      { path: "classrooms", Component: ClassroomsPage },
      { path: "courses", Component: CoursesPage },
      { path: "lecturers", Component: LecturersPage },
      { path: "timetable", Component: TimetablePage },
      { path: "auto-assignment", Component: AutoAssignmentPage },
      { path: "weekly-schedule", Component: WeeklySchedulePage },
      { path: "reports", Component: ReportsPage },
      { path: "user-management", Component: UserManagementPage },
      { path: "settings", Component: SettingsPage },
      // Staff routes
      { path: "staff", Component: StaffDashboardPage },
      { path: "staff/sections", Component: StaffSectionsPage },
      { path: "staff/schedule", Component: StaffSchedulePage },
      { path: "staff/allocation", Component: StaffAllocationPage },
      { path: "staff/lookup", Component: StaffLookupPage },
      { path: "staff/booking-list", Component: StaffBookingListPage },
      { path: "staff/bookings", Component: StaffBookingsPage },
      { path: "staff/room-change-list", Component: StaffRoomChangeListPage },
      // Lecturer routes
      { path: "lecturer/schedule", Component: LecturerSchedulePage },
      { path: "lecturer/room-booking", Component: LecturerBookingPage },
      { path: "lecturer/room-booking/history", Component: LecturerBookingHistoryPage },
      { path: "lecturer/maintenance-request", Component: LecturerMaintenanceRequestPage },
      { path: "lecturer/maintenance-history", Component: LecturerMaintenanceHistoryPage },
      { path: "lecturer/room-change-request", Component: LecturerRoomChangeRequestPage },
      { path: "lecturer/room-change-list", Component: LecturerRoomChangeListPage },
      // Employee routes
      { path: "employee", Component: EmployeePage },
      // Student routes
      { path: "student", Component: StudentPage }
    ]
  }
]);
export {
  router
};
