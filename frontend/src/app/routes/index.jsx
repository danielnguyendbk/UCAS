import { createBrowserRouter } from "react-router";
import { AppLayout } from "@/app/layouts/AppLayout";
import { APP_ROUTES } from "@/constants/routes";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import AdminAutoAssignmentPage from "@/features/admin/pages/AutoAssignmentPage";
import AdminClassroomsPage from "@/features/admin/pages/ClassroomsPage";
import AdminCoursesPage from "@/features/admin/pages/CoursesPage";
import AdminDashboardPage from "@/features/admin/pages/DashboardPage";
import AdminLecturersPage from "@/features/admin/pages/LecturersPage";
import AdminReportsPage from "@/features/admin/pages/ReportsPage";
import AdminSettingsPage from "@/features/admin/pages/SettingsPage";
import AdminUserManagementPage from "@/features/admin/pages/UserManagementPage";
import AdminWeeklySchedulePage from "@/features/admin/pages/WeeklySchedulePage";
import EmployeeUsagePage from "@/features/employee/pages/EmployeeUsagePage";
import EmployeeMaintenanceRequestPage from "@/features/employee/pages/EmployeeMaintenanceRequestPage";
import EmployeeMaintenanceHistoryPage from "@/features/employee/pages/EmployeeMaintenanceHistoryPage";
import EmployeeRoomUnlockPage from "@/features/employee/pages/EmployeeRoomUnlockPage";
import LecturerSchedulePage from "@/features/lecturer/pages/LecturerSchedulePage";
import LecturerBookingPage from "@/features/lecturer/pages/LecturerBookingPage";
import LecturerBookingHistoryPage from "@/features/lecturer/pages/LecturerBookingHistoryPage";
import LecturerMaintenanceRequestPage from "@/features/lecturer/pages/LecturerMaintenanceRequestPage";
import LecturerMaintenanceHistoryPage from "@/features/lecturer/pages/LecturerMaintenanceHistoryPage";
import LecturerRoomChangeListPage from "@/features/lecturer/pages/LecturerRoomChangeListPage";
import LecturerRoomChangeRequestPage from "@/features/lecturer/pages/LecturerRoomChangeRequestPage";
import StaffAllocationPage from "@/features/staff/pages/StaffAllocationPage";
import StaffBookingsPage from "@/features/staff/pages/StaffBookingsPage";
import StaffBookingListPage from "@/features/staff/pages/StaffBookingListPage";
import StaffDashboardPage from "@/features/staff/pages/StaffDashboardPage";
import StaffEmergencyRoomChangePage from "@/features/staff/pages/StaffEmergencyRoomChangePage";
import StaffLookupPage from "@/features/staff/pages/StaffLookupPage";
import StaffRoomChangeListPage from "@/features/staff/pages/StaffRoomChangeListPage";
import StaffMaintenanceListPage from "@/features/staff/pages/StaffMaintenanceListPage";
import StaffSchedulePage from "@/features/staff/pages/StaffSchedulePage";
import StaffSectionsPage from "@/features/staff/pages/StaffSectionsPage";
import StudentSchedulePage from "@/features/student/pages/StudentSchedulePage";
import StudentBookingPage from "@/features/student/pages/StudentBookingPage";
import StudentBookingHistoryPage from "@/features/student/pages/StudentBookingHistoryPage";
import StudentMaintenanceRequestPage from "@/features/student/pages/StudentMaintenanceRequestPage";
import StudentMaintenanceHistoryPage from "@/features/student/pages/StudentMaintenanceHistoryPage";
import TimetablePage from "@/features/timetable/pages/TimetablePage";

const appRouter = createBrowserRouter([
  {
    path: APP_ROUTES.login,
    Component: LoginPage
  },
  {
    path: APP_ROUTES.home,
    Component: AppLayout,
    children: [
      { index: true, Component: AdminDashboardPage },
      { path: APP_ROUTES.classrooms.slice(1), Component: AdminClassroomsPage },
      { path: APP_ROUTES.courses.slice(1), Component: AdminCoursesPage },
      { path: APP_ROUTES.lecturers.slice(1), Component: AdminLecturersPage },
      { path: APP_ROUTES.timetable.slice(1), Component: TimetablePage },
      { path: APP_ROUTES.autoAssignment.slice(1), Component: AdminAutoAssignmentPage },
      { path: APP_ROUTES.weeklySchedule.slice(1), Component: AdminWeeklySchedulePage },
      { path: APP_ROUTES.reports.slice(1), Component: AdminReportsPage },
      { path: APP_ROUTES.userManagement.slice(1), Component: AdminUserManagementPage },
      { path: APP_ROUTES.settings.slice(1), Component: AdminSettingsPage },
      // Staff routes
      { path: APP_ROUTES.staffDashboard.slice(1), Component: StaffDashboardPage },
      { path: APP_ROUTES.staffSections.slice(1), Component: StaffSectionsPage },
      { path: APP_ROUTES.staffSchedule.slice(1), Component: StaffSchedulePage },
      { path: APP_ROUTES.staffAllocation.slice(1), Component: StaffAllocationPage },
      { path: APP_ROUTES.staffLookup.slice(1), Component: StaffLookupPage },
      { path: APP_ROUTES.staffBookings.slice(1), Component: StaffBookingsPage },
      { path: APP_ROUTES.staffBookingList.slice(1), Component: StaffBookingListPage },
      { path: APP_ROUTES.staffRoomChangeList.slice(1), Component: StaffRoomChangeListPage },
      { path: APP_ROUTES.staffEmergencyRoomChange.slice(1), Component: StaffEmergencyRoomChangePage },
      { path: APP_ROUTES.staffMaintenanceList.slice(1), Component: StaffMaintenanceListPage },
      // Lecturer routes
      { path: APP_ROUTES.lecturerSchedule.slice(1), Component: LecturerSchedulePage },
      { path: APP_ROUTES.lecturerBooking.slice(1), Component: LecturerBookingPage },
      { path: APP_ROUTES.lecturerBookingHistory.slice(1), Component: LecturerBookingHistoryPage },
      { path: APP_ROUTES.lecturerMaintenanceRequest.slice(1), Component: LecturerMaintenanceRequestPage },
      { path: APP_ROUTES.lecturerMaintenanceHistory.slice(1), Component: LecturerMaintenanceHistoryPage },
      { path: APP_ROUTES.lecturerRoomChangeRequest.slice(1), Component: LecturerRoomChangeRequestPage },
      { path: APP_ROUTES.lecturerRoomChangeList.slice(1), Component: LecturerRoomChangeListPage },
      // Employee routes
      { path: APP_ROUTES.employeeUsage.slice(1), Component: EmployeeUsagePage },
      { path: APP_ROUTES.employeeMaintenanceRequest.slice(1), Component: EmployeeMaintenanceRequestPage },
      { path: APP_ROUTES.employeeMaintenanceHistory.slice(1), Component: EmployeeMaintenanceHistoryPage },
      { path: APP_ROUTES.employeeRoomUnlock.slice(1), Component: EmployeeRoomUnlockPage },
      // Student routes
      { path: APP_ROUTES.studentSchedule.slice(1), Component: StudentSchedulePage },
      { path: APP_ROUTES.studentBooking.slice(1), Component: StudentBookingPage },
      { path: APP_ROUTES.studentBookingHistory.slice(1), Component: StudentBookingHistoryPage },
      { path: APP_ROUTES.studentMaintenanceRequest.slice(1), Component: StudentMaintenanceRequestPage },
      { path: APP_ROUTES.studentMaintenanceHistory.slice(1), Component: StudentMaintenanceHistoryPage }
    ]
  }
]);
export {
  appRouter
};
