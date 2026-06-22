const APP_ROUTES = {
  login: "/login",
  home: "/admin/dashboard",

  // ADMIN
  adminDashboard: "/admin/dashboard",
  adminRooms: "/admin/rooms",
  adminCourses: "/admin/courses",
  adminLecturers: "/admin/lecturers",
  adminSections: "/admin/sections",
  adminTimetable: "/admin/timetable",
  adminTimetableImport: "/admin/timetable-import",
  adminAutoAssignment: "/admin/auto-assignment",
  adminTimetableApproval: "/admin/timetable-approval",
  adminCalendarBlocks: "/admin/calendar-blocks",
  adminTimetableVersions: "/admin/timetable-versions",
  adminExams: "/admin/exams",
  adminReports: "/admin/reports",
  adminUsers: "/admin/users",
  adminFacilityStaff: "/admin/facility-staff",
  adminSettings: "/admin/settings",

  // STAFF
  staffDashboard: "/staff/dashboard",
  staffTimetable: "/staff/timetable",
  staffTimetableImport: "/staff/timetable-import",
  staffAutoAssignment: "/staff/auto-assignment",
  staffConflicts: "/staff/conflicts",
  staffApprovalSubmit: "/staff/approval-submit",
  staffRoomChangeList: "/staff/room-change-list",
  staffBookingList: "/staff/booking-list",
  staffMaintenanceRequests: "/staff/maintenance-requests",
  staffLookup: "/staff/maintenance-requests",

  // FACILITY
  facilityTimetable: "/facility/timetable",
  facilityOpenClose: "/facility/open-close",
  facilityIssues: "/facility/issues",
  facilityRooms: "/facility/rooms",
  facilityMaintenanceRequest: "/facility/maintenance-request",
  /** @deprecated use facilityTimetable */
  facilityDashboard: "/facility/timetable",

  // LECTURER
  lecturerTimetable: "/lecturer/timetable",
  lecturerExams: "/lecturer/exams",
  lecturerRoomRequests: "/lecturer/room-requests",
  lecturerMaintenanceRequest: "/lecturer/maintenance-request",
  lecturerRoomBooking: "/lecturer/room-booking",
  lecturerMaintenanceHistory: "/lecturer/maintenance-history",
  /** @deprecated use lecturerTimetable */
  lecturerDashboard: "/lecturer/timetable",

  // STUDENT
  studentTimetable: "/student/timetable",
  studentExams: "/student/exams",
  studentRoomBooking: "/student/room-booking",
  studentMaintenanceRequest: "/student/maintenance-request",
  studentMaintenanceHistory: "/student/maintenance-history",
  /** @deprecated use studentTimetable */
  studentDashboard: "/student/timetable",

  // Legacy aliases (backward compatibility only)
  classrooms: "/admin/rooms",
  courses: "/admin/courses",
  lecturers: "/admin/lecturers",
  timetable: "/admin/timetable",
  autoAssignment: "/staff/auto-assignment",
  weeklySchedule: "/admin/timetable",
  reports: "/admin/reports",
  userManagement: "/admin/users",
  settings: "/admin/settings",

  staffSchedule: "/staff/timetable",
  staffClassSections: "/staff/timetable-import",
  staffAllocation: "/staff/auto-assignment",
  staffBookings: "/staff/booking-list",
  staffEmergencyRoomChange: "/staff/emergency-room-change",
  staffMaintenanceList: "/staff/maintenance-requests",

  lecturerSchedule: "/lecturer/timetable",
  lecturerBooking: "/lecturer/room-booking",
  lecturerBookingHistory: "/lecturer/room-requests",
  lecturerRoomChangeList: "/lecturer/room-requests",

  employeeDashboard: "/facility/timetable",
  employeeUsage: "/facility/rooms",
  employeeMaintenanceRequest: "/facility/maintenance-request",
  employeeMaintenanceHistory: "/facility/issues",
  employeeRoomUnlock: "/facility/open-close",
  employee: "/facility/timetable",

  studentSchedule: "/student/timetable",
  studentBooking: "/student/room-booking",
  studentBookingHistory: "/student/room-booking",
};

const ROLE_DEFAULT_PATHS = {
  ADMIN: APP_ROUTES.adminDashboard,
  STAFF: APP_ROUTES.staffDashboard,
  LECTURER: APP_ROUTES.lecturerTimetable,
  STUDENT: APP_ROUTES.studentTimetable,
  FACILITY: APP_ROUTES.facilityTimetable,
  EMPLOYEES: APP_ROUTES.facilityTimetable,
};

export { APP_ROUTES, ROLE_DEFAULT_PATHS };
