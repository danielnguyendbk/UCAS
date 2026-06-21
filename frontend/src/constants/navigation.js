import {
  ArrowLeftRight,
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  History,
  Key,
  LayoutDashboard,
  PlusSquare,
  School,
  Settings,
  Wrench,
} from "lucide-react";
import { APP_ROUTES } from "./routes";

const ROLE_LABELS = {
  Admin: "Quản trị viên",
  Staff: "Giáo vụ",
  Lecturer: "Giảng viên",
  Employee: "Nhân viên CSVC",
  Student: "Sinh viên",
};

const ROLE_BADGE_CLASSES = {
  Admin: "bg-red-100 text-red-700",
  Staff: "bg-blue-100 text-blue-700",
  Lecturer: "bg-purple-100 text-purple-700",
  Employee: "bg-orange-100 text-orange-700",
  Student: "bg-green-100 text-green-700",
};

const NAVIGATION_BY_ROLE = {
  Admin: [
    {
      type: "group",
      id: "admin-overview",
      label: "Tổng quan",
      icon: LayoutDashboard,
      children: [
        {
          id: "admin-dashboard",
          label: "Bảng điều khiển",
          path: APP_ROUTES.adminDashboard,
        },
      ],
    },
    {
      type: "group",
      id: "admin-training",
      label: "Quản lý đào tạo",
      icon: GraduationCap,
      children: [
        { id: "admin-courses", label: "Môn học", path: APP_ROUTES.adminCourses },
        { id: "admin-lecturers", label: "Giảng viên", path: APP_ROUTES.adminLecturers },
        { id: "admin-sections", label: "Lớp học phần", path: APP_ROUTES.adminSections },
      ],
    },
    {
      type: "group",
      id: "admin-timetable",
      label: "Thời khóa biểu",
      icon: Calendar,
      children: [
        {
          id: "admin-timetable-view",
          label: "Thời khóa biểu toàn trường",
          path: APP_ROUTES.adminTimetable,
        },
        {
          id: "admin-timetable-approval",
          label: "Duyệt và công bố lịch",
          path: APP_ROUTES.adminTimetableApproval,
        },
        {
          id: "admin-calendar-blocks",
          label: "Ngày nghỉ và lịch học vụ",
          path: APP_ROUTES.adminCalendarBlocks,
        },
      ],
    },
    {
      type: "group",
      id: "admin-facilities",
      label: "Cơ sở vật chất",
      icon: School,
      children: [
        { id: "admin-rooms", label: "Phòng học", path: APP_ROUTES.adminRooms },
        {
          id: "admin-facility-staff",
          label: "Nhân viên cơ sở vật chất",
          path: APP_ROUTES.adminFacilityStaff,
        },
      ],
    },
    {
      type: "group",
      id: "admin-exams",
      label: "Thi cử",
      icon: ClipboardCheck,
      children: [
        { id: "admin-exams", label: "Lịch thi", path: APP_ROUTES.adminExams },
      ],
    },
    {
      type: "group",
      id: "admin-system",
      label: "Hệ thống",
      icon: Settings,
      children: [
        { id: "admin-reports", label: "Báo cáo", path: APP_ROUTES.adminReports },
        {
          id: "admin-users",
          label: "Tài khoản người dùng",
          path: APP_ROUTES.adminUsers,
        },
        {
          id: "admin-settings",
          label: "Cài đặt hệ thống",
          path: APP_ROUTES.adminSettings,
        },
      ],
    },
  ],

  Staff: [
    {
      id: "staff-dashboard",
      icon: LayoutDashboard,
      label: "Tổng quan",
      path: APP_ROUTES.staffDashboard,
    },
    {
      id: "staff-timetable",
      icon: Calendar,
      label: "Thời khóa biểu",
      path: APP_ROUTES.staffTimetable,
    },
    {
      id: "staff-auto-assignment",
      icon: Building2,
      label: "Phân phòng học",
      path: APP_ROUTES.staffAutoAssignment,
    },

    { icon: PlusSquare, label: "Đặt phòng khẩn cấp", path: APP_ROUTES.staffBookings, badge: "G\u1EA5p" },
    {
      id: "staff-maintenance-requests",
      icon: Wrench,
      label: "Yêu cầu sửa chữa",
      path: APP_ROUTES.staffMaintenanceRequests,
    },
    {
      id: "staff-booking-list",
      icon: ClipboardCheck,
      label: "Danh sách đặt phòng",
      path: APP_ROUTES.staffBookingList,
    },
    {
      id: "staff-room-change-list",
      icon: ArrowLeftRight,
      label: "Danh sách đổi phòng",
      path: APP_ROUTES.staffRoomChangeList,
    },
    { icon: Wrench, label: "Quản lý sửa chữa", path: APP_ROUTES.staffMaintenanceList, badge: "Mới" }
  ],

  Employee: [
    {
      id: "facility-timetable",
      icon: Calendar,
      label: "Thời khóa biểu toàn trường",
      path: APP_ROUTES.facilityTimetable,
    },
    {
      id: "facility-maintenance-request",
      icon: Wrench,
      label: "Gửi yêu cầu sửa chữa",
      path: APP_ROUTES.facilityMaintenanceRequest,
    },
    {
      id: "facility-issues",
      icon: Building2,
      label: "Lịch sử sự cố sửa chữa",
      path: APP_ROUTES.facilityIssues,
    },
    {
      id: "facility-open-close",
      icon: Key,
      label: "Mở khóa phòng",
      path: APP_ROUTES.facilityOpenClose,
    },
    {
      id: "facility-rooms",
      icon: School,
      label: "Tình trạng phòng",
      path: APP_ROUTES.facilityRooms,
    },
  ],

  Lecturer: [
    {
      id: "lecturer-timetable",
      icon: CalendarCheck,
      label: "Thời khóa biểu",
      path: APP_ROUTES.lecturerTimetable,
    },
    {
      id: "lecturer-room-booking",
      icon: PlusSquare,
      label: "Đặt phòng",
      path: APP_ROUTES.lecturerRoomBooking,
    },
    {
      id: "lecturer-maintenance-request",
      icon: Wrench,
      label: "Yêu cầu sửa chữa",
      path: APP_ROUTES.lecturerMaintenanceRequest,
    },
    {
      id: "lecturer-room-requests",
      icon: ArrowLeftRight,
      label: "Yêu cầu đổi phòng",
      path: APP_ROUTES.lecturerRoomRequests,
    },
    {
      id: "lecturer-exams",
      icon: ClipboardCheck,
      label: "Lịch thi",
      path: APP_ROUTES.lecturerExams,
    },
  ],

  Student: [
    {
      id: "student-timetable",
      icon: GraduationCap,
      label: "Thời khóa biểu",
      path: APP_ROUTES.studentTimetable,
    },
    { type: "divider", label: "Đặt phòng" },
    {
      id: "student-room-booking",
      icon: PlusSquare,
      label: "Đặt phòng",
      path: APP_ROUTES.studentRoomBooking,
    },
    { icon: ClipboardList, label: "DS yêu cầu đặt phòng", path: APP_ROUTES.studentBookingHistory },
    { type: "divider", label: "Sửa chữa" },
    {
      id: "student-maintenance-request",
      icon: Wrench,
      label: "Yêu cầu sửa chữa",
      path: APP_ROUTES.studentMaintenanceRequest,
    },
    { icon: History, label: "Lịch sử sửa chữa", path: APP_ROUTES.studentMaintenanceHistory },
    {
      id: "student-exams",
      icon: ClipboardCheck,
      label: "Lịch thi",
      path: APP_ROUTES.studentExams,
    },
  ],
};

export { NAVIGATION_BY_ROLE, ROLE_BADGE_CLASSES, ROLE_LABELS };
