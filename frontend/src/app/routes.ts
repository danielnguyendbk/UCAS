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

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
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
    ],
  },
]);
