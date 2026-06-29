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

  // ADMIN EXAMS
  adminExams: "/admin/exams",
  adminExamImport: "/admin/exams/import",
  adminExamApproval: "/admin/exams/approval",

  adminReports: "/admin/reports",
  adminUsers: "/admin/users",
  adminAuditLogs: "/admin/audit-logs",
  adminFacilityStaff: "/admin/facility-staff",
  adminFacilityAssignments: "/admin/facility-assignments",
  adminSettings: "/admin/settings",

  // STAFF
  staffDashboard: "/staff/dashboard",
  staffTimetable: "/staff/timetable",
  staffTimetableImport: "/staff/timetable-import",
  staffAutoAssignment: "/staff/auto-assignment",
  staffConflicts: "/staff/conflicts",
  staffApprovalSubmit: "/staff/approval-submit",
  staffClassSections: "/staff/class-sections",
  staffEmergencyRoomChange: "/staff/emergency-room-change",
  staffRoomChangeList: "/staff/room-change-list",
  staffBookingList: "/staff/booking-list",
  staffMaintenanceRequests: "/staff/maintenance-requests",
  staffLookup: "/staff/lookup",
  staffFacilityAssignments: "/staff/facility-assignments",

  // STAFF EXAMS
  staffExamAllocation: "/staff/exams/allocation",
  staffExamSchedule: "/staff/exams/schedule",

  // FACILITY
  facilityTimetable: "/facility/timetable",
  facilityOpenClose: "/facility/opening-schedule",
  facilityOpeningSchedule: "/facility/opening-schedule",
  facilityIssues: "/facility/issues",
  facilityRooms: "/facility/rooms",
  facilityMaintenanceRequest: "/facility/maintenance-request",
  facilityDashboard: "/facility/timetable",

  // LECTURER
  lecturerTimetable: "/lecturer/timetable",
  lecturerExams: "/lecturer/exams",
  lecturerRoomRequests: "/lecturer/room-requests",
  lecturerMaintenanceRequest: "/lecturer/maintenance-request",
  lecturerRoomBooking: "/lecturer/room-booking",
  lecturerBookingHistory: "/lecturer/room-booking/history",
  lecturerMaintenanceHistory: "/lecturer/maintenance-history",
  lecturerRoomChangeRequest: "/lecturer/room-change-request",
  lecturerRoomChangeList: "/lecturer/room-change-list",
  lecturerDashboard: "/lecturer/timetable",

  // STUDENT
  studentTimetable: "/student/timetable",
  studentExams: "/student/exams",
  studentRoomBooking: "/student/room-booking",
  studentBookingHistory: "/student/room-booking/history",
  studentMaintenanceRequest: "/student/maintenance-request",
  studentMaintenanceHistory: "/student/maintenance-history",
  studentDashboard: "/student/timetable",

  // Legacy aliases
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
  staffAllocation: "/staff/auto-assignment",
  staffBookings: "/staff/emergency-room-change",
  staffMaintenanceList: "/staff/maintenance-requests",

  lecturerSchedule: "/lecturer/timetable",
  lecturerBooking: "/lecturer/room-booking",

  // Employee legacy aliases, giữ lại để không gãy code cũ
  employeeDashboard: "/facility/timetable",
  employeeUsage: "/facility/rooms",
  employeeMaintenanceRequest: "/facility/maintenance-request",
  employeeMaintenanceHistory: "/facility/issues",
  employeeRoomUnlock: "/facility/opening-schedule",
  employee: "/facility/timetable",

  studentSchedule: "/student/timetable",
  studentBooking: "/student/room-booking",
};

const ROLE_DEFAULT_PATHS = {
  ADMIN: APP_ROUTES.adminDashboard,
  STAFF: APP_ROUTES.staffDashboard,
  LECTURER: APP_ROUTES.lecturerTimetable,
  STUDENT: APP_ROUTES.studentTimetable,
  FACILITY: APP_ROUTES.facilityTimetable,

  // Legacy role, giữ nếu backend/cũ còn trả EMPLOYEES
  EMPLOYEES: APP_ROUTES.facilityTimetable,
};

export { APP_ROUTES, ROLE_DEFAULT_PATHS };