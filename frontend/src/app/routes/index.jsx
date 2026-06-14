import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/app/layouts/AppLayout";
import { APP_ROUTES, ROLE_DEFAULT_PATHS } from "@/constants/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import AdminClassroomsPage from "@/features/admin/pages/ClassroomsPage";
import AdminCoursesPage from "@/features/admin/pages/CoursesPage";
import AdminDashboardPage from "@/features/admin/pages/DashboardPage";
import AdminLecturersPage from "@/features/admin/pages/LecturersPage";
import AdminStudentsPage from "@/features/admin/pages/StudentsPage";
import AdminReportsPage from "@/features/admin/pages/ReportsPage";
import AdminSettingsPage from "@/features/admin/pages/SettingsPage";
import AdminSectionsPage from "@/features/admin/pages/SectionsPage";
import AdminWeeklySchedulePage from "@/features/admin/pages/WeeklySchedulePage";
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
import LecturerMaintenanceRequestPage from "@/features/lecturer/pages/LecturerMaintenanceRequestPage";
import LecturerMaintenanceHistoryPage from "@/features/lecturer/pages/LecturerMaintenanceHistoryPage";
import LecturerRoomChangeListPage from "@/features/lecturer/pages/LecturerRoomChangeListPage";
import StaffBookingListPage from "@/features/staff/pages/StaffBookingListPage";
import StaffDashboardPage from "@/features/staff/pages/StaffDashboardPage";
import StaffLookupPage from "@/features/staff/pages/StaffLookupPage";
import StaffRoomChangeListPage from "@/features/staff/pages/StaffRoomChangeListPage";
import StudentSchedulePage from "@/features/student/pages/StudentSchedulePage";
import StudentBookingPage from "@/features/student/pages/StudentBookingPage";
import StudentMaintenanceRequestPage from "@/features/student/pages/StudentMaintenanceRequestPage";
import StudentMaintenanceHistoryPage from "@/features/student/pages/StudentMaintenanceHistoryPage";

import { Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useNavigate } from "react-router";
import { AutoAssignmentPage } from "@/app/pages/AutoAssignmentPage";

const RoleHomeRedirect = () => {
  const { user } = useAuth();
  const target =
    ROLE_DEFAULT_PATHS[user?.backendRole] ?? APP_ROUTES.adminDashboard;

  return <Navigate to={target} replace />;
};

const PlaceholderPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/20 p-5 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <Info className="h-8 w-8 text-blue-500" />
      </div>

      <h1 className="mb-2 text-xl font-bold text-gray-800">
        Chức năng đang phát triển
      </h1>

      <p className="mb-6 max-w-md text-sm leading-relaxed text-gray-500">
        Tính năng này đang được thiết kế và phát triển theo lộ trình nâng cấp hệ
        thống quản lý UCAS. Vui lòng quay lại sau!
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
    Component: LoginPage,
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
      { path: "admin/students", Component: AdminStudentsPage },
      { path: "admin/sections", Component: AdminSectionsPage },
      { path: "admin/timetable", Component: AdminWeeklySchedulePage },
      {
        path: "admin/timetable-approval",
        Component: AdminTimetableApprovalPage,
      },
      { path: "admin/calendar-blocks", Component: AdminCalendarBlocksPage },
      { path: "admin/exams", Component: AdminExamsPage },
      { path: "admin/reports", Component: AdminReportsPage },

      // Không còn module Quản lý tài khoản trong Hệ thống.
      // Nếu người dùng gõ trực tiếp /admin/users thì chuyển về Báo cáo.
      {
        path: "admin/users",
        element: <Navigate to={APP_ROUTES.adminReports} replace />,
      },

      { path: "admin/facility-staff", Component: AdminFacilityStaffPage },
      { path: "admin/settings", Component: AdminSettingsPage },

      // STAFF routes
      { path: "staff/dashboard", Component: StaffDashboardPage },
      { path: "staff/timetable", Component: AdminWeeklySchedulePage },
      {
        path: "staff/timetable-import",
        element: (
          <Navigate to={`${APP_ROUTES.staffAutoAssignment}?tab=import`} replace />
        ),
      },
      { path: "staff/auto-assignment", Component: AutoAssignmentPage },
      {
        path: "staff/conflicts",
        element: (
          <Navigate to={`${APP_ROUTES.staffAutoAssignment}?tab=conflicts`} replace />
        ),
      },
      {
        path: "staff/approval-submit",
        element: (
          <Navigate to={`${APP_ROUTES.staffAutoAssignment}?tab=submit`} replace />
        ),
      },
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
      {
        path: "facility/maintenance-request",
        Component: EmployeeMaintenanceRequestPage,
      },

      // LECTURER routes
      {
        path: "lecturer/dashboard",
        element: <Navigate to={APP_ROUTES.lecturerTimetable} replace />,
      },
      { path: "lecturer/timetable", Component: LecturerSchedulePage },
      { path: "lecturer/exams", Component: PlaceholderPage },
      { path: "lecturer/room-requests", Component: LecturerRoomChangeListPage },
      {
        path: "lecturer/maintenance-request",
        Component: LecturerMaintenanceRequestPage,
      },
      {
        path: "lecturer/maintenance-history",
        Component: LecturerMaintenanceHistoryPage,
      },
      { path: "lecturer/room-booking", Component: LecturerBookingPage },

      // STUDENT routes
      {
        path: "student/dashboard",
        element: <Navigate to={APP_ROUTES.studentTimetable} replace />,
      },
      { path: "student/timetable", Component: StudentSchedulePage },
      { path: "student/exams", Component: PlaceholderPage },
      { path: "student/room-booking", Component: StudentBookingPage },
      {
        path: "student/maintenance-request",
        Component: StudentMaintenanceRequestPage,
      },
      {
        path: "student/maintenance-history",
        Component: StudentMaintenanceHistoryPage,
      },
    ],
  },
]);

export { appRouter };