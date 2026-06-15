import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/app/layouts/AppLayout";
import { APP_ROUTES, ROLE_DEFAULT_PATHS } from "@/constants/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import AdminClassroomsPage from "@/features/admin/pages/ClassroomsPage";
import AdminCoursesPage from "@/features/admin/pages/CoursesPage";
import AdminDashboardPage from "@/features/admin/pages/DashboardPage";
import AdminLecturersPage from "@/features/admin/pages/LecturersPage";
import AdminReportsPage from "@/features/admin/pages/ReportsPage";
import AdminSettingsPage from "@/features/admin/pages/SettingsPage";
import AdminSectionsPage from "@/features/admin/pages/SectionsPage";
import AdminUserManagementPage from "@/features/admin/pages/UserManagementPage";
import AdminWeeklySchedulePage from "@/features/admin/pages/WeeklySchedulePage";
import AdminAutoAssignmentPage from "@/features/admin/pages/AutoAssignmentPage";
import AdminTimetableApprovalPage from "@/features/admin/pages/TimetableApprovalPage";
import AdminCalendarBlocksPage from "@/features/admin/pages/CalendarBlocksPage";
import AdminExamsPage from "@/features/admin/pages/ExamsPage";
import AdminFacilityStaffPage from "@/features/admin/pages/FacilityStaffPage";
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
import StaffBookingsPage from "@/features/staff/pages/StaffBookingsPage";
import StaffBookingListPage from "@/features/staff/pages/StaffBookingListPage";
import StaffDashboardPage from "@/features/staff/pages/StaffDashboardPage";
import StaffEmergencyRoomChangePage from "@/features/staff/pages/StaffEmergencyRoomChangePage";
import StaffLookupPage from "@/features/staff/pages/StaffLookupPage";
import StaffRoomChangeListPage from "@/features/staff/pages/StaffRoomChangeListPage";
import StaffMaintenanceListPage from "@/features/staff/pages/StaffMaintenanceListPage";
import StaffSchedulePage from "@/features/staff/pages/StaffSchedulePage";
import StaffAutoAssignmentPage from "@/features/staff/pages/StaffAutoAssignmentPage";
import StudentSchedulePage from "@/features/student/pages/StudentSchedulePage";
import StudentBookingPage from "@/features/student/pages/StudentBookingPage";
import StudentBookingHistoryPage from "@/features/student/pages/StudentBookingHistoryPage";
import StudentMaintenanceRequestPage from "@/features/student/pages/StudentMaintenanceRequestPage";
import StudentMaintenanceHistoryPage from "@/features/student/pages/StudentMaintenanceHistoryPage";
import TimetablePage from "@/features/timetable/pages/TimetablePage";

import { Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useNavigate } from "react-router";

const RoleHomeRedirect = () => {
  const { user } = useAuth();
  const target =
    ROLE_DEFAULT_PATHS[user?.backendRole] ?? APP_ROUTES.adminDashboard;
  return <Navigate to={target} replace />;
};

const PlaceholderPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] p-5 text-center bg-gray-50/20 rounded-2xl border border-dashed border-gray-200">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <Info className="w-8 h-8 text-blue-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Chức năng đang phát triển</h1>
      <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
        Tính năng này đang được thiết kế và phát triển theo lộ trình nâng cấp hệ thống quản lý UCAS. Vui lòng quay lại sau!
      </p>
      <Button onClick={() => navigate(-1)} variant="outline" className="px-6">
        Quay lại
      </Button>
    </div>
  );
};

const appRouter = createBrowserRouter([
  {
    path: APP_ROUTES.login,
    Component: LoginPage
  },
  {
    path: "/",
    Component: AppLayout,
    children: [
      { index: true, Component: RoleHomeRedirect },
      
      // ADMIN routes
      { path: "admin/dashboard", Component: AdminDashboardPage },
      { path: "admin/rooms", Component: AdminClassroomsPage },
      { path: "admin/courses", Component: AdminCoursesPage },
      { path: "admin/lecturers", Component: AdminLecturersPage },
      { path: "admin/sections", Component: AdminSectionsPage },
      { path: "admin/timetable", Component: AdminWeeklySchedulePage }, // shared weekly schedule viewer
      { path: "admin/auto-assignment", Component: AdminAutoAssignmentPage },
      { path: "admin/timetable-approval", Component: AdminTimetableApprovalPage },
      { path: "admin/calendar-blocks", Component: AdminCalendarBlocksPage },
      { path: "admin/exams", Component: AdminExamsPage },
      { path: "admin/reports", Component: AdminReportsPage },
      { path: "admin/users", Component: AdminUserManagementPage },
      { path: "admin/facility-staff", Component: AdminFacilityStaffPage },
      { path: "admin/settings", Component: AdminSettingsPage },

      // STAFF routes
      { path: "staff/dashboard", Component: StaffDashboardPage },
      { path: "staff/timetable", Component: AdminWeeklySchedulePage }, // shared weekly schedule viewer
      { path: "staff/timetable-import", element: <Navigate to={`${APP_ROUTES.staffAutoAssignment}?tab=import`} replace /> },
      { path: "staff/auto-assignment", Component: StaffAutoAssignmentPage },
      { path: "staff/conflicts", element: <Navigate to={`${APP_ROUTES.staffAutoAssignment}?tab=conflicts`} replace /> },
      { path: "staff/approval-submit", element: <Navigate to={`${APP_ROUTES.staffAutoAssignment}?tab=submit`} replace /> },
      { path: "staff/room-change-list", Component: StaffRoomChangeListPage },
      { path: "staff/booking-list", Component: StaffBookingListPage },
      { path: "staff/maintenance-requests", Component: StaffLookupPage },
      { path: "staff/lookup", Component: StaffLookupPage },

      // FACILITY routes
      {
        path: "facility/dashboard",
        element: <Navigate to={APP_ROUTES.facilityTimetable} replace />,
      },
      { path: "facility/timetable", Component: AdminWeeklySchedulePage },
      { path: "facility/rooms", Component: EmployeeUsagePage },
      { path: "facility/open-close", Component: EmployeeRoomUnlockPage },
      { path: "facility/issues", Component: EmployeeMaintenanceHistoryPage },
      { path: "facility/maintenance-request", Component: EmployeeMaintenanceRequestPage },

      // LECTURER routes
      {
        path: "lecturer/dashboard",
        element: <Navigate to={APP_ROUTES.lecturerTimetable} replace />,
      },
      { path: "lecturer/timetable", Component: LecturerSchedulePage },
      { path: "lecturer/exams", Component: PlaceholderPage },
      { path: "lecturer/room-requests", Component: LecturerRoomChangeListPage },
      { path: "lecturer/maintenance-request", Component: LecturerMaintenanceRequestPage },
      { path: "lecturer/maintenance-history", Component: LecturerMaintenanceHistoryPage },
      { path: "lecturer/room-booking", Component: LecturerBookingPage },

      // STUDENT routes
      {
        path: "student/dashboard",
        element: <Navigate to={APP_ROUTES.studentTimetable} replace />,
      },
      { path: "student/timetable", Component: StudentSchedulePage },
      { path: "student/exams", Component: PlaceholderPage },
      { path: "student/room-booking", Component: StudentBookingPage },
      { path: "student/maintenance-request", Component: StudentMaintenanceRequestPage },
      { path: "student/maintenance-history", Component: StudentMaintenanceHistoryPage },
    ]
  }
]);

export {
  appRouter
};

