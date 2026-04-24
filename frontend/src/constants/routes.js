const APP_ROUTES = {
  login: "/login",
  home: "/",
  classrooms: "/classrooms",
  courses: "/courses",
  lecturers: "/lecturers",
  timetable: "/timetable",
  autoAssignment: "/auto-assignment",
  weeklySchedule: "/weekly-schedule",
  reports: "/reports",
  userManagement: "/user-management",
  settings: "/settings",
  staffDashboard: "/staff",
  staffSections: "/staff/sections",
  staffSchedule: "/staff/schedule",
  staffAllocation: "/staff/allocation",
  staffLookup: "/staff/lookup",
  staffBookings: "/staff/bookings",
  staffBookingList: "/staff/booking-list",
  staffRoomChangeList: "/staff/room-change-list",
  staffEmergencyRoomChange: "/staff/emergency-room-change",
  staffMaintenanceList: "/staff/maintenance-list",
  // Lecturer routes
  lecturerSchedule: "/lecturer/schedule",
  lecturerBooking: "/lecturer/room-booking",
  lecturerBookingHistory: "/lecturer/room-booking/history",
  lecturerMaintenanceRequest: "/lecturer/maintenance-request",
  lecturerMaintenanceHistory: "/lecturer/maintenance-history",
  lecturerRoomChangeRequest: "/lecturer/room-change-request",
  lecturerRoomChangeList: "/lecturer/room-change-list",
  // Legacy aliases (keep for backward compat)
  lecturerDashboard: "/lecturer/schedule",
  lecturerRequests: "/lecturer/room-booking",
  // Employee & Student
  employeeDashboard: "/employee/usage",
  employeeUsage: "/employee/usage",
  employeeMaintenanceRequest: "/employee/maintenance-request",
  employeeMaintenanceHistory: "/employee/maintenance-history",
  employeeRoomUnlock: "/employee/room-unlock",
  // Legacy aliases
  employee: "/employee/usage",
  // Student routes
  studentDashboard: "/student/schedule",
  studentSchedule: "/student/schedule",
  studentBooking: "/student/room-booking",
  studentBookingHistory: "/student/room-booking/history",
  studentMaintenanceRequest: "/student/maintenance-request",
  studentMaintenanceHistory: "/student/maintenance-history"
};
export {
  APP_ROUTES
};
